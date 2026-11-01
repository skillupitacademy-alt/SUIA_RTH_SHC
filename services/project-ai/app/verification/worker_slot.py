"""Cross-process admission control for memory-intensive verification work."""

import functools
import os
from contextlib import contextmanager
from pathlib import Path
import tempfile
from fastapi import HTTPException


@contextmanager
def verification_slot():
    directory = Path(os.environ.get('PROJECT_AI_STATE_DIR', tempfile.gettempdir()))
    directory.mkdir(parents=True, exist_ok=True)
    lock = (directory / 'project-ai-verification.lock').open('a+b')
    locked = False
    try:
        if os.name == 'nt':
            import msvcrt
            try:
                if os.fstat(lock.fileno()).st_size == 0:
                    lock.write(b'0')
                    lock.flush()
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_NBLCK, 1)
            except OSError as error:
                raise HTTPException(409, 'Another verification job is running. Retry after it completes.') from error
        else:
            import fcntl
            try:
                fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
            except BlockingIOError as error:
                raise HTTPException(409, 'Another verification job is running. Retry after it completes.') from error
        locked = True
        yield
    finally:
        if locked:
            if os.name == 'nt':
                lock.seek(0)
                msvcrt.locking(lock.fileno(), msvcrt.LK_UNLCK, 1)
            else:
                fcntl.flock(lock, fcntl.LOCK_UN)
        lock.close()


def serialize_verification(function):
    @functools.wraps(function)
    async def guarded(*args, **kwargs):
        if os.environ.get('PROJECT_AI_SERIAL_VERIFICATION') != 'true':
            return await function(*args, **kwargs)
        with verification_slot():
            return await function(*args, **kwargs)
    return guarded
