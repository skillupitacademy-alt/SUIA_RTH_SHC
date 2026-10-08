/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + REAL-WORLD ANALOGY

   VARIANT 03

   Rendering architecture:

       definition-analogy.json
                 ↓
       definition-analogy.js
                 ↓
                DOM
                 ↓
       definition-analogy.html


   RESPONSIBILITIES

   1. Load JSON
   2. Validate JSON
   3. Render category
   4. Render title
   5. Render introduction
   6. Render definition
   7. Render explanation
   8. Render analogy
   9. Render analogy connection
   10. Render takeaway
   11. Handle errors

   Tutorial content belongs ONLY in JSON.

   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const CONFIG = {

  dataUrl:
    "./definition.json"

};


/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const DOM = {

  page:
    document.getElementById(
      "definitionAnalogyPage"
    ),

  category:
    document.getElementById(
      "category"
    ),

  title:
    document.getElementById(
      "title"
    ),

  introduction:
    document.getElementById(
      "introduction"
    ),

  definition:
    document.getElementById(
      "definition"
    ),

  explanation:
    document.getElementById(
      "explanation"
    ),

  analogyIcon:
    document.getElementById(
      "analogyIcon"
    ),

  analogyTitle:
    document.getElementById(
      "analogyTitle"
    ),

  analogyDescription:
    document.getElementById(
      "analogyDescription"
    ),

  analogyConnection:
    document.getElementById(
      "analogyConnection"
    ),

  takeaway:
    document.getElementById(
      "takeaway"
    )

};


/* ============================================================
   3. APPLICATION START
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initializePage
);


/* ============================================================
   4. INITIALIZE PAGE
   ============================================================ */

async function initializePage() {

  try {

    /*
     * Load tutorial content.
     */

    const data =
      await loadData();


    /*
     * Validate the JSON structure.
     */

    validateData(
      data
    );


    /*
     * Render page.
     */

    renderPage(
      data
    );


    /*
     * Update browser title.
     */

    updateDocumentTitle(
      data
    );

  }

  catch (error) {

    console.error(
      "Definition + Real-World Analogy Error:",
      error
    );


    renderError(
      error
    );

  }

}


/* ============================================================
   5. LOAD JSON
   ============================================================ */

async function loadData() {

  const response =
    await fetch(
      CONFIG.dataUrl,
      {
        cache: "no-cache"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Unable to load tutorial content. HTTP ${response.status}`
    );

  }


  try {

    return await response.json();

  }

  catch (error) {

    throw new Error(
      "definition-analogy.json contains invalid JSON."
    );

  }

}


/* ============================================================
   6. VALIDATE JSON
   ============================================================ */

function validateData(
  data
) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Tutorial data must be a JSON object."
    );

  }


  if (
    !data.page ||
    typeof data.page !== "object"
  ) {

    throw new Error(
      "Missing required 'page' object."
    );

  }


  const requiredFields = [

    "category",
    "title",
    "introduction",
    "definition",
    "explanation",
    "analogy",
    "takeaway"

  ];


  requiredFields.forEach(
    field => {

      if (
        data.page[field] === undefined ||
        data.page[field] === null
      ) {

        throw new Error(
          `Missing required page field: ${field}`
        );

      }

    }
  );


  if (
    !data.page.analogy ||
    typeof data.page.analogy !== "object"
  ) {

    throw new Error(
      "'analogy' must be an object."
    );

  }


  const analogyFields = [

    "title",
    "description",
    "connection"

  ];


  analogyFields.forEach(
    field => {

      if (
        data.page.analogy[field] === undefined ||
        data.page.analogy[field] === null
      ) {

        throw new Error(
          `Missing required analogy field: ${field}`
        );

      }

    }
  );

}


/* ============================================================
   7. RENDER COMPLETE PAGE
   ============================================================ */

function renderPage(
  data
) {

  const page =
    data.page;


  /* ----------------------------------------------------------
     Header
     ---------------------------------------------------------- */

  setText(
    DOM.category,
    page.category
  );


  setText(
    DOM.title,
    page.title
  );


  setContent(
    DOM.introduction,
    page.introduction
  );


  /* ----------------------------------------------------------
     Definition
     ---------------------------------------------------------- */

  setContent(
    DOM.definition,
    page.definition
  );


  /* ----------------------------------------------------------
     Explanation
     ---------------------------------------------------------- */

  renderExplanation(
    DOM.explanation,
    page.explanation
  );


  /* ----------------------------------------------------------
     Real-World Analogy
     ---------------------------------------------------------- */

  renderAnalogy(
    page.analogy
  );


  /* ----------------------------------------------------------
     Key Takeaway
     ---------------------------------------------------------- */

  setContent(
    DOM.takeaway,
    page.takeaway
  );

}


/* ============================================================
   8. RENDER EXPLANATION
   ============================================================ */

function renderExplanation(
  container,
  explanation
) {

  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  /*
   * String explanation.
   */

  if (
    typeof explanation === "string"
  ) {

    appendParagraph(
      container,
      explanation
    );

    return;

  }


  /*
   * Array explanation.
   */

  if (
    Array.isArray(
      explanation
    )
  ) {

    explanation.forEach(
      item => {

        renderExplanationItem(
          container,
          item
        );

      }
    );

    return;

  }


  throw new Error(
    "'explanation' must be a string or array."
  );

}


/* ============================================================
   9. RENDER EXPLANATION ITEM
   ============================================================ */

function renderExplanationItem(
  container,
  item
) {

  /*
   * String item.
   */

  if (
    typeof item === "string"
  ) {

    appendParagraph(
      container,
      item
    );

    return;

  }


  /*
   * Ignore invalid items.
   */

  if (
    !item ||
    typeof item !== "object"
  ) {

    return;

  }


  const type =
    item.type ||
    "paragraph";


  switch (type) {

    case "paragraph":

      appendParagraph(
        container,
        item.content || ""
      );

      break;


    case "heading":

      appendHeading(
        container,
        item.content || ""
      );

      break;


    case "note":

      appendNote(
        container,
        item.content || ""
      );

      break;


    default:

      appendParagraph(
        container,
        item.content || ""
      );

      break;

  }

}


/* ============================================================
   10. APPEND PARAGRAPH
   ============================================================ */

function appendParagraph(
  container,
  content
) {

  const paragraph =
    document.createElement(
      "p"
    );


  setContent(
    paragraph,
    content
  );


  container.appendChild(
    paragraph
  );

}


/* ============================================================
   11. APPEND HEADING
   ============================================================ */

function appendHeading(
  container,
  content
) {

  const heading =
    document.createElement(
      "h3"
    );


  setContent(
    heading,
    content
  );


  container.appendChild(
    heading
  );

}


/* ============================================================
   12. APPEND NOTE
   ============================================================ */

function appendNote(
  container,
  content
) {

  const note =
    document.createElement(
      "p"
    );


  note.className =
    "explanation-note";


  setContent(
    note,
    content
  );


  container.appendChild(
    note
  );

}


/* ============================================================
   13. RENDER REAL-WORLD ANALOGY
   ============================================================ */

function renderAnalogy(
  analogy
) {

  /*
   * Title
   */

  setText(
    DOM.analogyTitle,
    analogy.title
  );


  /*
   * Description
   */

  setContent(
    DOM.analogyDescription,
    analogy.description
  );


  /*
   * Connection back to technical concept.
   */

  setContent(
    DOM.analogyConnection,
    analogy.connection
  );


  /*
   * Optional Font Awesome icon.
   *
   * Example:
   *
   * "icon": "fa-solid fa-box"
   */

  setAnalogyIcon(
    analogy.icon
  );

}


/* ============================================================
   14. SET ANALOGY ICON
   ============================================================ */

function setAnalogyIcon(
  iconClass
) {

  if (!DOM.analogyIcon) {

    return;

  }


  const safeIcon =
    iconClass ||
    "fa-solid fa-box";


  /*
   * Remove any existing classes.
   */

  DOM.analogyIcon.className =
    "";


  /*
   * Add the configured Font Awesome classes.
   */

  safeIcon
    .split(/\s+/)
    .filter(Boolean)
    .forEach(
      className => {

        DOM.analogyIcon.classList.add(
          className
        );

      }
    );

}


/* ============================================================
   15. SET TEXT
   ============================================================ */

/*
   Used where HTML is NOT required.

   Examples:

       Category
       Title
       Analogy title
*/

function setText(
  element,
  value
) {

  if (!element) {

    return;

  }


  element.textContent =
    value == null
      ? ""
      : String(value);

}


/* ============================================================
   16. SET CONTENT
   ============================================================ */

/*
   Tutorial content can contain trusted inline markup.

   Example:

       <code>x = 10</code>

   Therefore trusted tutorial content is rendered
   as HTML.

   IMPORTANT:

   If this engine later accepts untrusted user-generated
   content, this layer must be replaced with a sanitizer.
*/

function setContent(
  element,
  value
) {

  if (!element) {

    return;

  }


  element.innerHTML =
    value == null
      ? ""
      : String(value);

}


/* ============================================================
   17. UPDATE DOCUMENT TITLE
   ============================================================ */

function updateDocumentTitle(
  data
) {

  if (
    !data ||
    !data.page ||
    !data.page.title
  ) {

    return;

  }


  document.title =
    `${data.page.title} | Tutorial Engine`;

}


/* ============================================================
   18. ERROR STATE
   ============================================================ */

function renderError(
  error
) {

  if (!DOM.page) {

    return;

  }


  const message =
    error instanceof Error
      ? error.message
      : "Unable to load tutorial content.";


  DOM.page.innerHTML = `

    <section
      class="summary-error"
      role="alert"
      aria-live="assertive"
    >

      <strong>
        Unable to load tutorial content.
      </strong>

      <p>
        ${escapeHtml(message)}
      </p>

    </section>

  `;

}


/* ============================================================
   19. ESCAPE HTML
   ============================================================ */

function escapeHtml(
  value
) {

  return String(
    value
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
   20. DEVELOPMENT API
   ============================================================ */

/*
   During development you can run:

       TutorialDefinitionAnalogy.reload()

   from the browser console.

   This reloads the JSON and rerenders the page
   without requiring a page refresh.
*/

window.TutorialDefinitionAnalogy = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};