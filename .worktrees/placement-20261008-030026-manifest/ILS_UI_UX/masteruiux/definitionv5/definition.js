/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + WHY IT MATTERS

   VARIANT 04

   Rendering architecture:

       definition-importance.json
                 ↓
       definition-importance.js
                 ↓
                DOM
                 ↓
       definition-importance.html


   RESPONSIBILITIES

   1. Load JSON
   2. Validate JSON
   3. Render category
   4. Render title
   5. Render introduction
   6. Render definition
   7. Render explanation
   8. Render importance section
   9. Render practical impact
   10. Render takeaway
   11. Handle loading errors

   IMPORTANT:

   Tutorial content belongs in JSON.

   This JavaScript file contains
   rendering logic only.

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
      "definitionImportancePage"
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

  importanceIcon:
    document.getElementById(
      "importanceIcon"
    ),

  importanceTitle:
    document.getElementById(
      "importanceTitle"
    ),

  importanceDescription:
    document.getElementById(
      "importanceDescription"
    ),

  importanceImpact:
    document.getElementById(
      "importanceImpact"
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
     * Validate JSON structure.
     */

    validateData(
      data
    );


    /*
     * Render complete page.
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
      "Definition + Why It Matters Engine Error:",
      error
    );


    renderError(
      error
    );

  }

}


/* ============================================================
   5. LOAD JSON DATA
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
      "definition-importance.json contains invalid JSON."
    );

  }

}


/* ============================================================
   6. VALIDATE JSON STRUCTURE
   ============================================================ */

function validateData(
  data
) {

  /*
   * Root object.
   */

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Tutorial data must be a JSON object."
    );

  }


  /*
   * Page object.
   */

  if (
    !data.page ||
    typeof data.page !== "object"
  ) {

    throw new Error(
      "Missing required 'page' object."
    );

  }


  /*
   * Required page fields.
   */

  const requiredFields = [

    "category",
    "title",
    "introduction",
    "definition",
    "explanation",
    "importance",
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


  /*
   * Importance object.
   */

  if (
    !data.page.importance ||
    typeof data.page.importance !== "object"
  ) {

    throw new Error(
      "'importance' must be an object."
    );

  }


  /*
   * Required importance fields.
   */

  const importanceFields = [

    "title",
    "description",
    "impact"

  ];


  importanceFields.forEach(
    field => {

      if (
        data.page.importance[field] === undefined ||
        data.page.importance[field] === null
      ) {

        throw new Error(
          `Missing required importance field: ${field}`
        );

      }

    }
  );


  /*
   * Description can be either:
   *
   * string
   *
   * or
   *
   * array
   */

  const description =
    data.page.importance.description;


  if (
    typeof description !== "string" &&
    !Array.isArray(description)
  ) {

    throw new Error(
      "'importance.description' must be a string or array."
    );

  }

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
     HEADER
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
     DEFINITION
     ---------------------------------------------------------- */

  setContent(
    DOM.definition,
    page.definition
  );


  /* ----------------------------------------------------------
     EXPLANATION
     ---------------------------------------------------------- */

  renderExplanation(
    DOM.explanation,
    page.explanation
  );


  /* ----------------------------------------------------------
     WHY IS THIS IMPORTANT?
     ---------------------------------------------------------- */

  renderImportance(
    page.importance
  );


  /* ----------------------------------------------------------
     TAKEAWAY
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
   * Simple string.
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
   * Array of explanation items.
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
   * Ignore invalid item.
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
   13. RENDER IMPORTANCE
   ============================================================ */

function renderImportance(
  importance
) {

  /*
   * Title.
   */

  setText(
    DOM.importanceTitle,
    importance.title
  );


  /*
   * Description.

   * Supports:

       "description": "text"

   * OR:

       "description": [
         {
           "type": "paragraph",
           "content": "text"
         }
       ]
   */

  renderImportanceDescription(
    DOM.importanceDescription,
    importance.description
  );


  /*
   * Practical impact.
   */

  setContent(
    DOM.importanceImpact,
    importance.impact
  );


  /*
   * Optional icon.
   */

  setImportanceIcon(
    importance.icon
  );

}


/* ============================================================
   14. RENDER IMPORTANCE DESCRIPTION
   ============================================================ */

function renderImportanceDescription(
  container,
  description
) {

  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  /*
   * String.
   */

  if (
    typeof description === "string"
  ) {

    appendParagraph(
      container,
      description
    );

    return;

  }


  /*
   * Array.
   */

  if (
    Array.isArray(
      description
    )
  ) {

    description.forEach(
      item => {

        renderImportanceDescriptionItem(
          container,
          item
        );

      }
    );

    return;

  }


  throw new Error(
    "'importance.description' must be a string or array."
  );

}


/* ============================================================
   15. RENDER IMPORTANCE DESCRIPTION ITEM
   ============================================================ */

function renderImportanceDescriptionItem(
  container,
  item
) {

  /*
   * String.
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
   * Ignore invalid item.
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
   16. SET IMPORTANCE ICON
   ============================================================ */

function setImportanceIcon(
  iconClass
) {

  if (!DOM.importanceIcon) {

    return;

  }


  const safeIcon =
    iconClass ||
    "fa-solid fa-lightbulb";


  /*
   * Clear previous icon classes.
   */

  DOM.importanceIcon.className =
    "";


  /*
   * Apply configured Font Awesome classes.
   */

  safeIcon
    .split(/\s+/)
    .filter(Boolean)
    .forEach(
      className => {

        DOM.importanceIcon.classList.add(
          className
        );

      }
    );

}


/* ============================================================
   17. SET TEXT
   ============================================================ */

/*
   Use for plain text.

   Examples:

       category
       title
       importance title
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
   18. SET CONTENT
   ============================================================ */

/*
   Tutorial content may contain trusted inline HTML.

   Example:

       <code>x = 10</code>

   Therefore authored tutorial content is rendered
   through innerHTML.

   IMPORTANT:

   If this engine later accepts untrusted user-generated
   content, sanitize this content before rendering.
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
   19. UPDATE DOCUMENT TITLE
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
   20. ERROR STATE
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
   21. ESCAPE HTML
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
   22. DEVELOPMENT API
   ============================================================ */

/*
   Browser console:

       TutorialDefinitionImportance.reload()

   This reloads the JSON and rerenders the page.
*/

window.TutorialDefinitionImportance = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};