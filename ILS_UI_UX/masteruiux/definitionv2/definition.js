/* ============================================================
   TUTORIAL ENGINE
   DEFINITION — CLASSIC VARIANT

   Rendering flow:

       definition.json
              ↓
       definition.js
              ↓
          DOM elements
              ↓
       definition.html

   This file contains NO tutorial-specific content.

   Content belongs in definition.json.

   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const CONFIG = {

  /*
   JSON file loaded by this page.

   Keep this file beside definition.html,
   definition.css and definition.js.
  */
  dataUrl: "./definition.json"

};


/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const DOM = {

  category:
    document.getElementById("category"),

  title:
    document.getElementById("title"),

  introduction:
    document.getElementById("introduction"),

  definition:
    document.getElementById("definition"),

  explanation:
    document.getElementById("explanation"),

  takeaway:
    document.getElementById("takeaway")

};


/* ============================================================
   3. APPLICATION START
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initializeDefinitionPage
);


/* ============================================================
   4. INITIALIZE PAGE
   ============================================================ */

async function initializeDefinitionPage() {

  try {

    const data =
      await loadDefinitionData();

    validateDefinitionData(data);

    renderDefinitionPage(data);

    updateDocumentTitle(data);

  }

  catch (error) {

    console.error(
      "Tutorial Definition Engine Error:",
      error
    );

    renderErrorState(error);

  }

}


/* ============================================================
   5. LOAD JSON
   ============================================================ */

async function loadDefinitionData() {

  const response =
    await fetch(
      CONFIG.dataUrl,
      {
        cache: "no-cache"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Unable to load definition content. HTTP ${response.status}`
    );

  }


  let data;


  try {

    data =
      await response.json();

  }

  catch (error) {

    throw new Error(
      "definition.json contains invalid JSON."
    );

  }


  return data;

}


/* ============================================================
   6. VALIDATE DATA
   ============================================================ */

function validateDefinitionData(data) {

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Definition data must be a JSON object."
    );

  }


  if (
    !data.page ||
    typeof data.page !== "object"
  ) {

    throw new Error(
      "Missing required 'page' object in definition.json."
    );

  }


  const requiredFields = [

    "category",
    "title",
    "introduction",
    "definition",
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
    data.page.explanation === undefined
  ) {

    throw new Error(
      "Missing required page field: explanation"
    );

  }

}


/* ============================================================
   7. RENDER COMPLETE PAGE
   ============================================================ */

function renderDefinitionPage(data) {

  const page =
    data.page;


  /*
   * Header
   */

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


  /*
   * Definition
   */

  setContent(
    DOM.definition,
    page.definition
  );


  /*
   * Explanation
   */

  renderExplanation(
    DOM.explanation,
    page.explanation
  );


  /*
   * Takeaway
   */

  setContent(
    DOM.takeaway,
    page.takeaway
  );

}


/* ============================================================
   8. RENDER EXPLANATION
   ============================================================ */

/*
   Supported JSON formats:

   A) String

   "explanation":
     "A variable is a name that refers to an object."


   B) Array of strings

   "explanation": [
     "First explanation paragraph.",
     "Second explanation paragraph."
   ]


   C) Array of objects

   "explanation": [
     {
       "type": "paragraph",
       "content": "..."
     }
   ]

   This gives us room to extend the renderer later
   without rewriting the current page.
*/

function renderExplanation(
  container,
  explanation
) {

  if (!container) {

    return;

  }


  container.innerHTML = "";


  /*
   * String
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
   * Array
   */

  if (
    Array.isArray(explanation)
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
    "Explanation must be a string or array."
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
   * Simple string
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
   * Object
   */

  if (
    !item ||
    typeof item !== "object"
  ) {

    return;

  }


  const type =
    item.type || "paragraph";


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
    document.createElement("p");


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
    document.createElement("h3");


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
    document.createElement("p");


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
   13. SET TEXT
   ============================================================ */

/*
   Used when content must be treated strictly as text.

   Example:

       title
       category

   This prevents accidental HTML injection.
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
   14. SET CONTENT
   ============================================================ */

/*
   Tutorial content may intentionally contain simple
   presentation markup such as:

       Python <code>variable</code>

   Therefore content fields are rendered as HTML.

   IMPORTANT:

   This is appropriate for trusted Tutorial Engine
   JSON authored by the platform.

   Do NOT use untrusted user-generated HTML here
   without sanitization.
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
   15. DOCUMENT TITLE
   ============================================================ */

function updateDocumentTitle(data) {

  if (
    !data ||
    !data.page
  ) {

    return;

  }


  const title =
    data.page.title;


  if (!title) {

    return;

  }


  document.title =
    `${title} | Tutorial Engine`;

}


/* ============================================================
   16. ERROR STATE
   ============================================================ */

function renderErrorState(
  error
) {

  const message =
    error instanceof Error
      ? error.message
      : "Unable to load tutorial content.";


  /*
   * Replace page contents with a clean error message.
   */

  const page =
    document.getElementById(
      "definitionPage"
    );


  if (!page) {

    return;

  }


  page.innerHTML = `

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
   17. ESCAPE HTML
   ============================================================ */

/*
   Used only for displaying JavaScript-generated
   error messages safely.
*/

function escapeHtml(
  value
) {

  return String(value)

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
   18. DEBUG HELPER
   ============================================================ */

/*
   Useful during development.

   In production this can be disabled later.
*/

window.TutorialDefinition =
  {

    reload: initializeDefinitionPage,

    loadData: loadDefinitionData

  };