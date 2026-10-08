/* ============================================================
   SUIA / TUTORIAL ENGINE
   SUMMARY PAGE RENDERER

   Architecture:

       summary.json
             ↓
       summary.js
             ↓
       summary.html
             ↓
       summary.css

   The renderer is generic.

   ============================================================ */


const CONTENT_FILE =
  "summary.json";


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initializeSummaryPage
);


/* ============================================================
   LOAD JSON
   ============================================================ */

async function initializeSummaryPage() {

  try {

    const response =
      await fetch(
        CONTENT_FILE,
        {
          cache: "no-store"
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
      typeof data !== "object" ||
      Array.isArray(data)
    ) {

      throw new Error(
        "Invalid summary JSON structure."
      );

    }


    renderPage(
      data
    );


  } catch (error) {

    console.error(
      "[Tutorial Engine] Summary loading failed:",
      error
    );


    showError(
      error.message
    );

  }

}


/* ============================================================
   RENDER COMPLETE PAGE
   ============================================================ */

function renderPage(
  data
) {

  renderHeader(
    data
  );


  renderSummary(
    data
  );


  renderRevisionTable(
    data
  );


  renderQuickTips(
    data
  );


  renderFinalTip(
    data
  );

}


/* ============================================================
   HEADER
   ============================================================ */

function renderHeader(
  data
) {

  const page =
    data.page ||
    {};


  setText(
    "pageBadgeText",
    page.badge ||
    "REVISION & SUMMARY"
  );


  setIcon(
    "pageBadgeIcon",
    page.badgeIcon ||
    "fa-book-open"
  );


  setText(
    "pageTitle",
    page.title ||
    ""
  );


  setText(
    "pageIntroduction",
    page.introduction ||
    ""
  );

}


/* ============================================================
   SUMMARY
   ============================================================ */

function renderSummary(
  data
) {

  const container =
    document.getElementById(
      "summaryList"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  const items =
    Array.isArray(
      data.summary
    )
      ? data.summary
      : [];


  items.forEach(
    (
      item,
      index
    ) => {

      const row =
        document.createElement(
          "div"
        );


      row.className =
        "summary-item";


      const check =
        document.createElement(
          "span"
        );


      check.className =
        "summary-check";


      check.innerHTML =
        '<i class="fa-solid fa-check"></i>';


      check.setAttribute(
        "aria-hidden",
        "true"
      );


      const text =
        document.createElement(
          "div"
        );


      text.className =
        "summary-text";


      text.innerHTML =
        formatInline(
          item.text ||
          item
        );


      row.appendChild(
        check
      );


      row.appendChild(
        text
      );


      container.appendChild(
        row
      );

    }
  );

}


/* ============================================================
   REVISION TABLE
   ============================================================ */

function renderRevisionTable(
  data
) {

  const container =
    document.getElementById(
      "revisionTable"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  const table =
    data.revisionTable ||
    {};


  renderTableHeader(
    container,
    table.columns ||
    []
  );


  const rows =
    Array.isArray(
      table.rows
    )
      ? table.rows
      : [];


  rows.forEach(
    row => {

      renderRevisionRow(
        container,
        row
      );

    }
  );

}


/* ============================================================
   TABLE HEADER
   ============================================================ */

function renderTableHeader(
  container,
  columns
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "revision-row revision-header-row";


  row.setAttribute(
    "role",
    "row"
  );


  columns.forEach(
    column => {

      const cell =
        document.createElement(
          "div"
        );


      cell.className =
        "revision-header-cell";


      cell.setAttribute(
        "role",
        "columnheader"
      );


      if (
        column.icon
      ) {

        const icon =
          document.createElement(
            "span"
          );


        icon.className =
          "header-icon";


        icon.innerHTML =
          `<i class="${escapeAttribute(column.icon)}"></i>`;


        cell.appendChild(
          icon
        );

      }


      const label =
        document.createElement(
          "span"
        );


      label.textContent =
        column.title ||
        "";


      cell.appendChild(
        label
      );


      row.appendChild(
        cell
      );

    }
  );


  container.appendChild(
    row
  );

}


/* ============================================================
   REVISION ROW
   ============================================================ */

function renderRevisionRow(
  container,
  rowData
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "revision-row revision-body-row";


  row.setAttribute(
    "role",
    "row"
  );


  renderConceptCell(
    row,
    rowData.concept
  );


  renderKeyPointCell(
    row,
    rowData.keyPoint
  );


  renderExampleCell(
    row,
    rowData.example
  );


  renderRememberCell(
    row,
    rowData.remember
  );


  container.appendChild(
    row
  );

}


/* ============================================================
   CONCEPT CELL
   ============================================================ */

function renderConceptCell(
  row,
  data
) {

  const cell =
    document.createElement(
      "div"
    );


  cell.className =
    "revision-cell concept-cell";


  cell.setAttribute(
    "role",
    "cell"
  );


  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "concept-icon";


  icon.innerHTML =
    `<i class="${escapeAttribute(data.icon || "fa-solid fa-circle")}"></i>`;


  const name =
    document.createElement(
      "span"
    );


  name.className =
    "concept-name";


  name.textContent =
    data.name ||
    "";


  cell.appendChild(
    icon
  );


  cell.appendChild(
    name
  );


  row.appendChild(
    cell
  );

}


/* ============================================================
   KEY POINT CELL
   ============================================================ */

function renderKeyPointCell(
  row,
  data
) {

  const cell =
    document.createElement(
      "div"
    );


  cell.className =
    "revision-cell key-point-cell";


  cell.setAttribute(
    "role",
    "cell"
  );


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "key-point-title";


  title.textContent =
    data.title ||
    "";


  cell.appendChild(
    title
  );


  const description =
    document.createElement(
      "div"
    );


  description.className =
    "key-point-description";


  description.innerHTML =
    formatInline(
      data.description ||
      ""
    );


  cell.appendChild(
    description
  );


  if (
    data.code
  ) {

    const code =
      document.createElement(
        "code"
      );


    code.className =
      "example-code";


    code.textContent =
      data.code;


    cell.appendChild(
      code
    );

  }


  row.appendChild(
    cell
  );

}


/* ============================================================
   EXAMPLE CELL
   ============================================================ */

function renderExampleCell(
  row,
  data
) {

  const cell =
    document.createElement(
      "div"
    );


  cell.className =
    "revision-cell example-cell";


  cell.setAttribute(
    "role",
    "cell"
  );


  if (
    data &&
    data.code
  ) {

    const code =
      document.createElement(
        "code"
      );


    code.className =
      "example-code";


    code.textContent =
      data.code;


    cell.appendChild(
      code
    );

  } else {

    cell.textContent =
      data?.text ||
      "";

  }


  row.appendChild(
    cell
  );

}


/* ============================================================
   REMEMBER CELL
   ============================================================ */

function renderRememberCell(
  row,
  data
) {

  const cell =
    document.createElement(
      "div"
    );


  cell.className =
    "revision-cell remember-cell";


  cell.setAttribute(
    "role",
    "cell"
  );


  const title =
    document.createElement(
      "div"
    );


  title.className =
    "remember-title";


  title.innerHTML =
    formatInline(
      data.title ||
      ""
    );


  cell.appendChild(
    title
  );


  const description =
    document.createElement(
      "div"
    );


  description.className =
    "remember-description";


  description.innerHTML =
    formatInline(
      data.description ||
      ""
    );


  cell.appendChild(
    description
  );


  row.appendChild(
    cell
  );

}


/* ============================================================
   QUICK TIPS
   ============================================================ */

function renderQuickTips(
  data
) {

  const container =
    document.getElementById(
      "tipsCard"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  const tips =
    Array.isArray(
      data.quickTips
    )
      ? data.quickTips
      : [];


  tips.forEach(
    tip => {

      const item =
        document.createElement(
          "div"
        );


      item.className =
        "tip-item";


      const check =
        document.createElement(
          "span"
        );


      check.className =
        "tip-check";


      check.innerHTML =
        '<i class="fa-solid fa-check"></i>';


      check.setAttribute(
        "aria-hidden",
        "true"
      );


      const text =
        document.createElement(
          "span"
        );


      text.innerHTML =
        formatInline(
          tip.text ||
          tip
        );


      item.appendChild(
        check
      );


      item.appendChild(
        text
      );


      container.appendChild(
        item
      );

    }
  );

}


/* ============================================================
   FINAL TIP
   ============================================================ */

function renderFinalTip(
  data
) {

  const tip =
    data.finalTip ||
    {};


  setText(
    "finalTipTitle",
    tip.title ||
    "Quick Revision Tip"
  );


  const textElement =
    document.getElementById(
      "finalTipText"
    );


  if (!textElement) {
    return;
  }


  textElement.innerHTML =
    formatInline(
      tip.text ||
      ""
    );

}


/* ============================================================
   INLINE FORMATTER
   ============================================================ */

function formatInline(
  value
) {

  if (
    value === undefined ||
    value === null
  ) {

    return "";

  }


  return escapeHTML(
    value
  )
    .replace(
      /&lt;code&gt;(.*?)&lt;\/code&gt;/g,
      "<code>$1</code>"
    );

}


/* ============================================================
   TEXT
   ============================================================ */

function setText(
  id,
  value
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.textContent =
    value ??
    "";

}


/* ============================================================
   ICON
   ============================================================ */

function setIcon(
  id,
  icon
) {

  const element =
    document.getElementById(
      id
    );


  if (!element) {
    return;
  }


  element.className =
    `fa-solid ${sanitizeClassName(icon)}`;

}


/* ============================================================
   ESCAPE HTML
   ============================================================ */

function escapeHTML(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /&/g,
      "&amp;"
    )
    .replace(
      /</g,
      "&lt;"
    )
    .replace(
      />/g,
      "&gt;"
    )
    .replace(
      /"/g,
      "&quot;"
    )
    .replace(
      /'/g,
      "&#039;"
    );

}


/* ============================================================
   ESCAPE ATTRIBUTE
   ============================================================ */

function escapeAttribute(
  value
) {

  return String(
    value ?? ""
  )
    .replace(
      /[^a-zA-Z0-9_-]/g,
      " "
    )
    .trim();

}


/* ============================================================
   CLASS SANITIZATION
   ============================================================ */

function sanitizeClassName(
  value
) {

  return String(
    value ||
    ""
  )
    .replace(
      /[^a-zA-Z0-9_-]/g,
      ""
    );

}


/* ============================================================
   ERROR
   ============================================================ */

function showError(
  message
) {

  const page =
    document.getElementById(
      "summaryPage"
    );


  if (!page) {
    return;
  }


  page.innerHTML =
    `
      <section class="summary-error">

        <strong>
          Unable to load tutorial summary.
        </strong>

        <p>
          ${escapeHTML(message)}
        </p>

      </section>
    `;

}