/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + KEY CHARACTERISTICS

   VARIANT 02

   Rendering architecture:

       definition-characteristics.json
                    ↓
       definition-characteristics.js
                    ↓
                 DOM
                    ↓
       definition-characteristics.html


   RESPONSIBILITIES OF THIS FILE:

   1. Load JSON
   2. Validate JSON
   3. Render page header
   4. Render definition
   5. Render explanation
   6. Render unlimited characteristics
   7. Render takeaway
   8. Handle loading errors

   IMPORTANT:

   Tutorial content does NOT belong in this file.

   All tutorial content belongs in:

       definition-characteristics.json

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
      "definitionCharacteristicsPage"
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

  characteristicsGrid:
    document.getElementById(
      "characteristicsGrid"
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
     * Load content from JSON.
     */

    const data =
      await loadData();


    /*
     * Validate the structure before
     * attempting to render it.
     */

    validateData(
      data
    );


    /*
     * Render all page sections.
     */

    renderPage(
      data
    );


    /*
     * Update browser tab title.
     */

    updateDocumentTitle(
      data
    );

  }

  catch (error) {

    console.error(
      "Definition + Characteristics Engine Error:",
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
      "definition-characteristics.json contains invalid JSON."
    );

  }

}


/* ============================================================
   6. VALIDATE JSON STRUCTURE
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
    "characteristics",
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
    !Array.isArray(
      data.page.characteristics
    )
  ) {

    throw new Error(
      "'characteristics' must be an array."
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
   * Characteristics
   */

  renderCharacteristics(
    DOM.characteristicsGrid,
    page.characteristics
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

function renderExplanation(
  container,
  explanation
) {

  if (!container) {

    return;

  }


  container.innerHTML = "";


  /*
   * Simple string.
   *
   * Example:
   *
   * "explanation": "A variable is..."
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
   * Array.
   *
   * Example:
   *
   * "explanation": [
   *   "Paragraph one",
   *   "Paragraph two"
   * ]
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
   * Object item.
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
   10. APPEND EXPLANATION PARAGRAPH
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
   11. APPEND EXPLANATION HEADING
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
   12. APPEND EXPLANATION NOTE
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
   13. RENDER CHARACTERISTICS
   ============================================================ */

/*
   This function is deliberately generic.

   It does NOT assume that there are exactly
   4, 5 or 6 characteristics.

   JSON can contain:

       4 characteristics
       5 characteristics
       6 characteristics
       10 characteristics
       20 characteristics

   The renderer will create as many cards
   as are present in the JSON.

   Example JSON item:

   {
     "id": "dynamic-typing",
     "title": "Dynamic Typing",
     "description": "...",
     "icon": "fa-code",
     "example": "x = 10"
   }

*/

function renderCharacteristics(
  container,
  characteristics
) {

  if (!container) {

    return;

  }


  container.innerHTML = "";


  if (
    !Array.isArray(
      characteristics
    )
  ) {

    return;

  }


  characteristics.forEach(
    (
      characteristic,
      index
    ) => {

      const card =
        createCharacteristicCard(
          characteristic,
          index
        );


      container.appendChild(
        card
      );

    }
  );

}


/* ============================================================
   14. CREATE CHARACTERISTIC CARD
   ============================================================ */

function createCharacteristicCard(
  characteristic,
  index
) {

  /*
   * Card
   */

  const card =
    document.createElement(
      "article"
    );


  card.className =
    "characteristic-card";


  /*
   * Accessibility label.
   */

  card.setAttribute(
    "aria-label",
    characteristic.title ||
      `Characteristic ${index + 1}`
  );


  /*
   * Number
   */

  const number =
    document.createElement(
      "span"
    );


  number.className =
    "characteristic-number";


  number.textContent =
    formatNumber(
      index + 1
    );


  /*
   * Icon
   */

  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "characteristic-icon";


  icon.setAttribute(
    "aria-hidden",
    "true"
  );


  const iconClass =
    characteristic.icon ||
    "fa-solid fa-circle-check";


  icon.innerHTML =
    `<i class="${escapeAttribute(iconClass)}"></i>`;


  /*
   * Title
   */

  const title =
    document.createElement(
      "h3"
    );


  title.className =
    "characteristic-title";


  setText(
    title,
    characteristic.title ||
      `Characteristic ${index + 1}`
  );


  /*
   * Description
   */

  const description =
    document.createElement(
      "p"
    );


  description.className =
    "characteristic-description";


  setContent(
    description,
    characteristic.description || ""
  );


  /*
   * Add basic content.
   */

  card.appendChild(
    number
  );


  card.appendChild(
    icon
  );


  card.appendChild(
    title
  );


  card.appendChild(
    description
  );


  /*
   * Optional example.
   *
   * The card does NOT require an example.
   */

  if (
    characteristic.example
  ) {

    const example =
      document.createElement(
        "code"
      );


    example.className =
      "characteristic-example";


    setText(
      example,
      characteristic.example
    );


    card.appendChild(
      example
    );

  }


  return card;

}


/* ============================================================
   15. FORMAT CHARACTERISTIC NUMBER
   ============================================================ */

function formatNumber(
  number
) {

  return String(
    number
  ).padStart(
    2,
    "0"
  );

}


/* ============================================================
   16. SET TEXT
   ============================================================ */

/*
   Used for values that should be treated
   strictly as text.

   Examples:

       category
       title
       characteristic title
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
   17. SET CONTENT
   ============================================================ */

/*
   Tutorial JSON may contain trusted inline markup:

       <code>x = 10</code>

   Therefore content fields are rendered
   using innerHTML.

   IMPORTANT:

   This is intended for trusted Tutorial Engine
   authored content.

   If user-generated content is introduced later,
   sanitize it before rendering.
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
   18. UPDATE DOCUMENT TITLE
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
   19. ERROR STATE
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
   20. ESCAPE HTML
   ============================================================ */

/*
   Used only when displaying error messages.

   This prevents an error message from being
   interpreted as HTML.
*/

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
   21. ESCAPE ATTRIBUTE
   ============================================================ */

/*
   Used for the Font Awesome class attribute.
*/

function escapeAttribute(
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
      /"/g,
      "&quot;"
    )

    .replace(
      /</g,
      "&lt;"
    )

    .replace(
      />/g,
      "&gt;"
    );

}


/* ============================================================
   22. DEVELOPMENT API
   ============================================================ */

/*
   Allows us to manually reload the page
   from the browser console during development:

       TutorialDefinitionCharacteristics.reload()

*/

window.TutorialDefinitionCharacteristics = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};