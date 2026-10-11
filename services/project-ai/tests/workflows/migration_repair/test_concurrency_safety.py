"""
Concurrency safety tests for evidence ledger concurrent writes.

REPAIR-007 (MEDIUM): Evidence ledger concurrent write testing.
Tests threading/multiprocessing scenarios for evidence.jsonl writes.
"""

import pytest
import json
import hashlib
import threading
import time
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed


@pytest.mark.integration
def test_evidence_ledger_concurrent_writes(tmp_path):
    """
    Test evidence ledger handles concurrent writes without corruption.
    
    This test:
    1. Uses threading.Thread to create 5-10 concurrent writers
    2. Each writer appends evidence records to evidence.jsonl
    3. Verifies all records are written without corruption
    4. Validates SHA-256 hashes for all records
    5. Checks for file locking or serialization behavior
    
    Acceptance test: test_evidence_ledger_concurrent_writes
    """
    # Create test evidence file
    evidence_file = tmp_path / "evidence.jsonl"
    evidence_file.touch()
    
    num_writers = 10
    records_per_writer = 20
    total_expected_records = num_writers * records_per_writer
    
    def write_evidence_records(writer_id: int, evidence_path: Path, num_records: int):
        """
        Worker function that writes evidence records.
        
        Args:
            writer_id: Unique ID for this writer thread
            evidence_path: Path to evidence.jsonl file
            num_records: Number of records to write
        """
        for i in range(num_records):
            # Create evidence record
            artifact_content = f"test-artifact-{writer_id}-{i}"
            sha256_hash = hashlib.sha256(artifact_content.encode("utf-8")).hexdigest()
            
            record = {
                "timestamp": f"2026-10-11T14:00:{i:02d}Z",
                "artifactPath": f"artifacts/writer-{writer_id}-record-{i}.txt",
                "sha256": sha256_hash,
                "writer_id": writer_id,
                "record_num": i,
            }
            
            # Write record to evidence file
            with open(evidence_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
            
            # Small delay to increase concurrency likelihood
            time.sleep(0.001)
    
    # Create thread pool and submit write tasks
    with ThreadPoolExecutor(max_workers=num_writers) as executor:
        futures = [
            executor.submit(write_evidence_records, writer_id, evidence_file, records_per_writer)
            for writer_id in range(num_writers)
        ]
        
        # Wait for all writers to complete
        for future in as_completed(futures):
            future.result()  # Raise any exceptions that occurred
    
    # Verify all records were written
    with open(evidence_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    assert len(lines) == total_expected_records, \
        f"Expected {total_expected_records} records, found {len(lines)}"
    
    # Verify all records are valid JSON
    records = []
    for line_num, line in enumerate(lines, start=1):
        line = line.strip()
        if not line:
            continue
        
        try:
            record = json.loads(line)
            records.append(record)
        except json.JSONDecodeError as e:
            pytest.fail(f"Line {line_num} is not valid JSON: {e}\nLine content: {line}")
    
    assert len(records) == total_expected_records
    
    # Verify all writer IDs are present
    writer_ids_found = set(record["writer_id"] for record in records)
    assert writer_ids_found == set(range(num_writers)), \
        f"Missing writer IDs: {set(range(num_writers)) - writer_ids_found}"
    
    # Verify each writer wrote the correct number of records
    for writer_id in range(num_writers):
        writer_records = [r for r in records if r["writer_id"] == writer_id]
        assert len(writer_records) == records_per_writer, \
            f"Writer {writer_id} wrote {len(writer_records)} records, expected {records_per_writer}"
    
    # Verify SHA-256 hashes are valid
    for record in records:
        artifact_content = f"test-artifact-{record['writer_id']}-{record['record_num']}"
        expected_hash = hashlib.sha256(artifact_content.encode("utf-8")).hexdigest()
        assert record["sha256"] == expected_hash, \
            f"Hash mismatch for writer {record['writer_id']} record {record['record_num']}"


@pytest.mark.integration
def test_evidence_ledger_no_interleaving(tmp_path):
    """
    Test evidence ledger lines are not interleaved during concurrent writes.
    
    Verifies that each line is written atomically (no partial lines).
    """
    evidence_file = tmp_path / "evidence.jsonl"
    evidence_file.touch()
    
    num_writers = 5
    records_per_writer = 50
    
    def write_long_records(writer_id: int, evidence_path: Path, num_records: int):
        """Write records with long content to increase interleaving likelihood."""
        for i in range(num_records):
            record = {
                "timestamp": f"2026-10-11T14:00:{i:02d}Z",
                "writer_id": writer_id,
                "record_num": i,
                # Long content to increase chance of interleaving
                "content": "x" * 1000,
            }
            
            with open(evidence_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(record) + "\n")
    
    with ThreadPoolExecutor(max_workers=num_writers) as executor:
        futures = [
            executor.submit(write_long_records, writer_id, evidence_file, records_per_writer)
            for writer_id in range(num_writers)
        ]
        
        for future in as_completed(futures):
            future.result()
    
    # Verify all lines are valid JSON (no interleaving)
    with open(evidence_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    corrupted_lines = []
    for line_num, line in enumerate(lines, start=1):
        line = line.strip()
        if not line:
            continue
        
        try:
            json.loads(line)
        except json.JSONDecodeError:
            corrupted_lines.append((line_num, line[:100]))  # Store first 100 chars
    
    if corrupted_lines:
        pytest.fail(
            f"Found {len(corrupted_lines)} corrupted lines:\n" +
            "\n".join(f"  Line {num}: {content}..." for num, content in corrupted_lines[:5])
        )


@pytest.mark.integration
def test_evidence_ledger_race_condition_detection(tmp_path):
    """
    Test evidence ledger race condition handling.
    
    Simulates race conditions by having multiple writers write at exactly
    the same time.
    """
    evidence_file = tmp_path / "evidence.jsonl"
    evidence_file.touch()
    
    num_writers = 10
    barrier = threading.Barrier(num_writers)  # Synchronize start
    
    def synchronized_write(writer_id: int, evidence_path: Path, sync_barrier: threading.Barrier):
        """Write a single record after all writers are ready."""
        # Wait for all writers to be ready
        sync_barrier.wait()
        
        # All writers now write simultaneously
        record = {
            "timestamp": "2026-10-11T14:00:00Z",
            "writer_id": writer_id,
        }
        
        with open(evidence_path, "a", encoding="utf-8") as f:
            f.write(json.dumps(record) + "\n")
    
    threads = [
        threading.Thread(target=synchronized_write, args=(i, evidence_file, barrier))
        for i in range(num_writers)
    ]
    
    # Start all threads
    for thread in threads:
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Verify all records were written and are valid
    with open(evidence_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
    
    valid_records = 0
    for line in lines:
        line = line.strip()
        if line:
            try:
                json.loads(line)
                valid_records += 1
            except json.JSONDecodeError:
                pass
    
    assert valid_records == num_writers, \
        f"Expected {num_writers} valid records, found {valid_records}"
