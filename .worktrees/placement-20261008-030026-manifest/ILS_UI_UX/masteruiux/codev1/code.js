/* ============================================================
   SUIA TUTORIAL ENGINE
   CODE PAGE JAVASCRIPT
   ============================================================ */

const CONTENT_FILE = "code.json";


/* ============================================================
   DOM HELPER
   ============================================================ */

function getElement(id) {

  return document.getElementById(id);

}


/* ============================================================
   SAFE TEXT
   ============================================================ */

function setText(id, value) {

  const element = getElement(id);

  if (!element) {
    return;
  }

  element.textContent =
    value === undefined || value === null
      ? ""
      : String(value);

}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHTML(value) {

  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

}


/* ============================================================
   INLINE MARKUP
   ============================================================ */

function formatInlineContent(value) {

  if (!value) {
    return "";
  }

  return escapeHTML(value)
    .replace(
      /&lt;code&gt;(.*?)&lt;\/code&gt;/g,
      "<code>$1</code>"
    );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initializeCodePage
);


/* ============================================================
   LOAD JSON
   ============================================================ */

async function initializeCodePage() {

  try {

    const response =
      await fetch(
        CONTENT_FILE,
        {
          cache: "no-cache"
        }
      );


    if (!response.ok) {

      throw new Error(
        `Unable to load ${CONTENT_FILE}. HTTP ${response.status}`
      );

    }


    const data =
      await response.json();


    if (
      !data ||
      typeof data !== "object"
    ) {

      throw new Error(
        "Invalid JSON structure."
      );

    }


    renderCodePage(data);


  } catch (error) {

    console.error(
      "Code Page Error:",
      error
    );


    showPageError(
      "Unable to load tutorial content."
    );

  }

}


/* ============================================================
   RENDER PAGE
   ============================================================ */

function renderCodePage(data) {

  renderHeader(data);

  renderCode(data);

  renderExplanation(data);

  renderOutput(data);

  renderMemoryModel(data);

  renderTakeaway(data);

  renderTip(data);

  initializeCopyButton();

}


/* ============================================================
   HEADER
   ============================================================ */

function renderHeader(data) {

  const page =
    data.page || {};


  setText(
    "pageType",
    page.type ||
      "CODE + EXPLANATION"
  );


  setText(
    "pageTitle",
    page.title ||
      "Code Example"
  );


  setText(
    "pageIntroduction",
    page.introduction ||
      ""
  );

}


/* ============================================================
   CODE
   ============================================================ */

function renderCode(data) {

  const code =
    data.code || {};


  const codeElement =
    getElement("codeBlock");


  if (!codeElement) {
    return;
  }


  setText(
    "codeLanguage",
    code.language ||
      "Python"
  );


  codeElement.textContent =
    code.source ||
    "";


  const prismLanguage =
    code.prismLanguage ||
    "python";


  codeElement.className =
    `language-${prismLanguage}`;


  highlightCode(
    codeElement
  );

}


/* ============================================================
   PRISM
   ============================================================ */

function highlightCode(codeElement) {

  if (
    window.Prism &&
    typeof window.Prism.highlightElement ===
      "function"
  ) {

    window.Prism.highlightElement(
      codeElement
    );

    return;

  }


  let attempts = 0;

  const maxAttempts = 20;


  const retry =
    setInterval(
      () => {

        attempts++;


        if (
          window.Prism &&
          typeof window.Prism.highlightElement ===
            "function"
        ) {

          clearInterval(
            retry
          );


          window.Prism.highlightElement(
            codeElement
          );

        }


        if (
          attempts >= maxAttempts
        ) {

          clearInterval(
            retry
          );

        }

      },
      100
    );

}


/* ============================================================
   EXPLANATION
   ============================================================ */

function renderExplanation(data) {

  const explanation =
    data.explanation || {};


  const container =
    getElement(
      "explanationTable"
    );


  if (!container) {
    return;
  }


  container.innerHTML = "";


  const steps =
    Array.isArray(
      explanation.steps
    )
      ? explanation.steps
      : [];


  steps.forEach(
    (step, index) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "explanation-row";


      const number =
        document.createElement(
          "div"
        );


      number.className =
        "explanation-number";


      number.textContent =
        step.number ||
        index + 1;


      const code =
        document.createElement(
          "div"
        );


      code.className =
        "explanation-code";


      code.textContent =
        step.code ||
        "";


      const description =
        document.createElement(
          "div"
        );


      description.className =
        "explanation-description";


      description.innerHTML =
        formatInlineContent(
          step.description ||
            ""
        );


      row.appendChild(
        number
      );


      row.appendChild(
        code
      );


      row.appendChild(
        description
      );


      container.appendChild(
        row
      );

    }
  );

}


/* ============================================================
   OUTPUT
   ============================================================ */

function renderOutput(data) {

  const output =
    data.output || {};


  const outputElement =
    getElement(
      "outputContent"
    );


  if (!outputElement) {
    return;
  }


  outputElement.textContent =
    output.value ||
    "";

}


/* ============================================================
   MEMORY / MODEL
   ============================================================

   IMPORTANT:

   OLD:

   [x card] [y card] [result card]


   NEW:

   Variables              Objects in Memory             Values

       x       ─────→     id: 140...           ─────→   10 (int)

       y       ─────→     id: 140...           ─────→   20 (int)

     result    ─────→     id: 140...           ─────→   30 (int)

   ============================================================ */
/* ============================================================
   MEMORY / MODEL
   ============================================================ */

function renderMemoryModel(data) {

  const memory =
    data.memoryModel || {};


  /* ==========================================================
     DESCRIPTION
     ========================================================== */

  setText(
    "memoryDescription",
    memory.description || ""
  );


  /* ==========================================================
     CONTAINER
     ========================================================== */

  const container =
    getElement("memoryModel");


  if (!container) {
    return;
  }


  container.innerHTML = "";


  /* ==========================================================
     ROW DATA
     ========================================================== */

  const rows =
    Array.isArray(memory.rows)
      ? memory.rows
      : [];


  if (rows.length === 0) {
    return;
  }


  /* ==========================================================
     MAIN DIAGRAM
     ========================================================== */

  const diagram =
    document.createElement("div");


  diagram.className =
    "memory-diagram";


  /* ==========================================================
     COLUMN HEADERS
     ========================================================== */

  const variableHeader =
    document.createElement("div");


  variableHeader.className =
    "memory-column-header";


  variableHeader.textContent =
    memory.columnHeaders?.variables ||
    "Variables (References)";


  const objectHeader =
    document.createElement("div");


  objectHeader.className =
    "memory-column-header";


  objectHeader.textContent =
    memory.columnHeaders?.objects ||
    "Objects in Memory";


  const valueHeader =
    document.createElement("div");


  valueHeader.className =
    "memory-column-header";


  valueHeader.textContent =
    memory.columnHeaders?.values ||
    "Values";


  diagram.appendChild(
    variableHeader
  );


  diagram.appendChild(
    objectHeader
  );


  diagram.appendChild(
    valueHeader
  );


  /* ==========================================================
     MEMORY ROWS
     ========================================================== */

  rows.forEach(
    (rowData, index) => {

      const row =
        document.createElement("div");


      row.className =
        "memory-diagram-row";


      row.dataset.index =
        String(index);


      /* ======================================================
         VARIABLE
         ====================================================== */

      const variable =
        document.createElement("div");


      variable.className =
        "memory-variable";


      variable.textContent =
        rowData.variable || "";


      /* ======================================================
         RESULT STATE
         ====================================================== */

      const isResult =
        index === rows.length - 1;


      if (isResult) {

        variable.classList.add(
          "memory-result"
        );

      }


      /* ======================================================
         VARIABLE → OBJECT ARROW
         ====================================================== */

      const variableArrow =
        document.createElement("span");


      variableArrow.className =
        "memory-variable-arrow";


      variableArrow.setAttribute(
        "aria-hidden",
        "true"
      );


      variable.appendChild(
        variableArrow
      );


      /* ======================================================
         VERTICAL x ↓ y ↓ result ARROW

         IMPORTANT:

         Do NOT create the vertical arrow using
         ::before / ::after.

         It is a real DOM element so that it cannot
         conflict with the horizontal arrow.
         ====================================================== */

      if (index < rows.length - 1) {

        const verticalArrow =
          document.createElement("span");


        verticalArrow.className =
          "memory-vertical-arrow";


        verticalArrow.setAttribute(
          "aria-hidden",
          "true"
        );


        row.appendChild(
          verticalArrow
        );

      }


      /* ======================================================
         OBJECT IN MEMORY
         ====================================================== */

      const object =
        document.createElement("div");


      object.className =
        "memory-object";


      if (isResult) {

        object.classList.add(
          "memory-result"
        );

      }


      object.textContent =
        rowData.objectId ||
        rowData.object ||
        "";


      /* ======================================================
         OBJECT → VALUE ARROW
         ====================================================== */

      const objectArrow =
        document.createElement("span");


      objectArrow.className =
        "memory-object-arrow";


      objectArrow.setAttribute(
        "aria-hidden",
        "true"
      );


      object.appendChild(
        objectArrow
      );


      /* ======================================================
         VALUE
         ====================================================== */

      const value =
        document.createElement("div");


      value.className =
        "memory-value";


      if (isResult) {

        value.classList.add(
          "memory-result"
        );

      }


      value.textContent =
        rowData.value || "";


      /* ======================================================
         APPEND COLUMNS
         ====================================================== */

      row.appendChild(
        variable
      );


      row.appendChild(
        object
      );


      row.appendChild(
        value
      );


      /* ======================================================
         APPEND ROW
         ====================================================== */

      diagram.appendChild(
        row
      );

    }
  );


  /* ==========================================================
     APPEND DIAGRAM
     ========================================================== */

  container.appendChild(
    diagram
  );


  /* ==========================================================
     MEMORY NOTE
     ========================================================== */

  const note =
    getElement("memoryNote");


  if (note) {

    note.textContent =
      memory.note || "";


    note.style.display =
      memory.note
        ? "flex"
        : "none";

  }

}


/* ============================================================
   TAKEAWAY
   ============================================================ */

function renderTakeaway(data) {

  const takeaway =
    data.takeaway || {};


  const list =
    getElement(
      "takeawayList"
    );


  if (!list) {
    return;
  }


  list.innerHTML = "";


  const items =
    Array.isArray(
      takeaway.items
    )
      ? takeaway.items
      : [];


  items.forEach(
    item => {

      const listItem =
        document.createElement(
          "li"
        );


      listItem.innerHTML =
        formatInlineContent(
          item
        );


      list.appendChild(
        listItem
      );

    }
  );

}


/* ============================================================
   TIP
   ============================================================ */

function renderTip(data) {

  const tip =
    data.tip || {};


  setText(
    "tipText",
    tip.text ||
      ""
  );

}


/* ============================================================
   COPY BUTTON
   ============================================================ */

function initializeCopyButton() {

  const button =
    getElement(
      "copyCodeButton"
    );


  if (!button) {
    return;
  }


  button.addEventListener(
    "click",
    copyPythonCode
  );

}


async function copyPythonCode() {

  const codeElement =
    getElement(
      "codeBlock"
    );


  const button =
    getElement(
      "copyCodeButton"
    );


  if (
    !codeElement ||
    !button
  ) {
    return;
  }


  const code =
    codeElement.textContent ||
    "";


  try {

    if (
      navigator.clipboard &&
      window.isSecureContext
    ) {

      await navigator.clipboard.writeText(
        code
      );

    } else {

      fallbackCopy(
        code
      );

    }


    showCopiedState(
      button
    );


  } catch (error) {

    console.error(
      "Clipboard error:",
      error
    );

  }

}


/* ============================================================
   FALLBACK COPY
   ============================================================ */

function fallbackCopy(text) {

  const textarea =
    document.createElement(
      "textarea"
    );


  textarea.value =
    text;


  textarea.setAttribute(
    "readonly",
    ""
  );


  textarea.style.position =
    "fixed";


  textarea.style.top =
    "-9999px";


  textarea.style.left =
    "-9999px";


  document.body.appendChild(
    textarea
  );


  textarea.focus();

  textarea.select();


  const successful =
    document.execCommand(
      "copy"
    );


  document.body.removeChild(
    textarea
  );


  if (!successful) {

    throw new Error(
      "Unable to copy code."
    );

  }

}


/* ============================================================
   COPIED STATE
   ============================================================ */

function showCopiedState(button) {

  const original =
    button.innerHTML;


  button.innerHTML =
    `
      <i
        class="fa-solid fa-check"
        aria-hidden="true"
      ></i>

      <span>
        Copied
      </span>
    `;


  setTimeout(
    () => {

      button.innerHTML =
        original;

    },
    1800
  );

}


/* ============================================================
   ERROR
   ============================================================ */

function showPageError(message) {

  const page =
    getElement(
      "codePage"
    );


  if (!page) {
    return;
  }


  page.innerHTML =
    `
      <section
        style="
          width:100%;
          max-width:900px;
          margin:80px auto;
          padding:28px;
          border:1px solid #e2c3d0;
          border-radius:12px;
          background:#fff8fb;
          font-family:Inter,sans-serif;
        "
      >

        <div
          style="
            display:flex;
            align-items:center;
            gap:10px;
            margin-bottom:10px;
            color:#0B1B3D;
            font-size:24px;
            font-weight:800;
          "
        >

          <i
            class="fa-solid fa-triangle-exclamation"
            style="color:#f54a8d;"
          ></i>

          Code Page Error

        </div>


        <p
          style="
            margin:0;
            color:#45658f;
            font-size:16px;
            line-height:1.6;
          "
        >
          ${escapeHTML(message)}
        </p>

      </section>
    `;

}