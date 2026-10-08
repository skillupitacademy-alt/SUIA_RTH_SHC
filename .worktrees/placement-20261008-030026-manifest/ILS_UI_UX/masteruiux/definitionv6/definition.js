/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + VISUAL CONCEPT

   VARIANT 05

   Responsibilities:

   1. Load JSON
   2. Validate JSON
   3. Render page content
   4. Render explanation
   5. Render dynamic visual model
   6. Render visual connectors
   7. Render visual explanation
   8. Render takeaway
   9. Handle loading errors

   IMPORTANT:

   Tutorial content belongs in JSON.

   This file contains rendering logic only.

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
      "definitionVisualPage"
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

  visualIntroduction:
    document.getElementById(
      "visualIntroduction"
    ),

  visualModel:
    document.getElementById(
      "visualModel"
    ),

  visualExplanation:
    document.getElementById(
      "visualExplanation"
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

    const data =
      await loadData();


    validateData(
      data
    );


    renderPage(
      data
    );


    updateDocumentTitle(
      data
    );

  }

  catch (error) {

    console.error(
      "Definition + Visual Concept Engine Error:",
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
      "definition-visual.json contains invalid JSON."
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
    "visual",
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
    !data.page.visual ||
    typeof data.page.visual !== "object"
  ) {

    throw new Error(
      "'visual' must be an object."
    );

  }


  const visualFields = [

    "introduction",
    "model",
    "explanation"

  ];


  visualFields.forEach(
    field => {

      if (
        data.page.visual[field] === undefined ||
        data.page.visual[field] === null
      ) {

        throw new Error(
          `Missing required visual field: ${field}`
        );

      }

    }
  );


  if (
    !Array.isArray(
      data.page.visual.model
    )
  ) {

    throw new Error(
      "'visual.model' must be an array."
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
     VISUAL CONCEPT
     ---------------------------------------------------------- */

  renderVisual(
    page.visual
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


  if (
    typeof explanation === "string"
  ) {

    appendParagraph(
      container,
      explanation
    );

    return;

  }


  if (
    Array.isArray(
      explanation
    )
  ) {

    explanation.forEach(
      item => {

        renderContentItem(
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
   9. GENERIC CONTENT ITEM RENDERER
   ============================================================ */

function renderContentItem(
  container,
  item
) {

  if (
    typeof item === "string"
  ) {

    appendParagraph(
      container,
      item
    );

    return;

  }


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
   13. RENDER VISUAL CONCEPT
   ============================================================ */

function renderVisual(
  visual
) {

  /*
   * Introduction.
   */

  setContent(
    DOM.visualIntroduction,
    visual.introduction
  );


  /*
   * Model.
   */

  renderVisualModel(
    DOM.visualModel,
    visual.model
  );


  /*
   * Explanation.
   */

  renderVisualExplanation(
    DOM.visualExplanation,
    visual.explanation
  );

}


/* ============================================================
   14. RENDER VISUAL MODEL
   ============================================================ */

function renderVisualModel(
  container,
  model
) {

  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "visual-model-wrapper";


  /*
   * Each model item can describe:

       node

   OR

       connector

   OR

       row

   This allows different visual structures to be
   represented through JSON.
   */

  model.forEach(
    item => {

      renderVisualItem(
        wrapper,
        item
      );

    }
  );


  container.appendChild(
    wrapper
  );

}


/* ============================================================
   15. RENDER VISUAL ITEM
   ============================================================ */

function renderVisualItem(
  container,
  item
) {

  if (
    !item ||
    typeof item !== "object"
  ) {

    return;

  }


  const type =
    item.type ||
    "node";


  switch (type) {

    case "node":

      container.appendChild(
        createVisualNode(
          item
        )
      );

      break;


    case "connector":

      container.appendChild(
        createVisualConnector(
          item
        )
      );

      break;


    case "row":

      container.appendChild(
        createVisualRow(
          item
        )
      );

      break;


    default:

      container.appendChild(
        createVisualNode(
          item
        )
      );

      break;

  }

}


/* ============================================================
   16. CREATE VISUAL NODE
   ============================================================ */

function createVisualNode(
  node
) {

  const element =
    document.createElement(
      "article"
    );


  element.className =
    "visual-node";


  /*
   * Highlight node when requested.
   */

  if (
    node.highlight === true
  ) {

    element.classList.add(
      "highlight"
    );

  }


  /*
   * Optional icon.
   */

  if (
    node.icon
  ) {

    const icon =
      document.createElement(
        "span"
      );


    icon.className =
      "visual-node-icon";


    setIconClasses(
      icon,
      node.icon
    );


    element.appendChild(
      icon
    );

  }


  /*
   * Node title.
   */

  if (
    node.title
  ) {

    const title =
      document.createElement(
        "span"
      );


    title.className =
      "visual-node-title";


    setText(
      title,
      node.title
    );


    element.appendChild(
      title
    );

  }


  /*
   * Node description.
   */

  if (
    node.description
  ) {

    const description =
      document.createElement(
        "span"
      );


    description.className =
      "visual-node-description";


    setContent(
      description,
      node.description
    );


    element.appendChild(
      description
    );

  }


  return element;

}


/* ============================================================
   17. CREATE VISUAL CONNECTOR
   ============================================================ */

function createVisualConnector(
  connector
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "visual-connector";


  /*
   * Vertical connector.

       type: "connector"
       direction: "vertical"
   */

  if (
    connector.direction ===
    "vertical"
  ) {

    element.classList.add(
      "vertical"
    );

  }


  /*
   * Arrow icon.

   * Default:

       fa-solid fa-arrow-right
   */

  const icon =
    document.createElement(
      "i"
    );


  setIconClasses(
    icon,
    connector.icon ||
    (
      connector.direction === "vertical"
        ? "fa-solid fa-arrow-down"
        : "fa-solid fa-arrow-right"
    )
  );


  element.appendChild(
    icon
  );


  return element;

}


/* ============================================================
   18. CREATE VISUAL ROW
   ============================================================ */

function createVisualRow(
  row
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "visual-model-row";


  /*
   * Render child items recursively.
   */

  if (
    Array.isArray(
      row.items
    )
  ) {

    row.items.forEach(
      item => {

        renderVisualItem(
          element,
          item
        );

      }
    );

  }


  return element;

}


/* ============================================================
   19. RENDER VISUAL EXPLANATION
   ============================================================ */

function renderVisualExplanation(
  container,
  explanation
) {

  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    typeof explanation === "string"
  ) {

    appendParagraph(
      container,
      explanation
    );

    return;

  }


  if (
    Array.isArray(
      explanation
    )
  ) {

    explanation.forEach(
      item => {

        renderContentItem(
          container,
          item
        );

      }
    );

    return;

  }


  throw new Error(
    "'visual.explanation' must be a string or array."
  );

}


/* ============================================================
   20. SET ICON CLASSES
   ============================================================ */

function setIconClasses(
  element,
  iconClass
) {

  if (!element) {

    return;

  }


  element.className =
    "";


  String(
    iconClass
  )

    .split(/\s+/)
    .filter(Boolean)
    .forEach(
      className => {

        element.classList.add(
          className
        );

      }
    );

}


/* ============================================================
   21. SET TEXT
   ============================================================ */

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
   22. SET CONTENT
   ============================================================ */

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
   23. UPDATE DOCUMENT TITLE
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
   24. ERROR STATE
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
   25. ESCAPE HTML
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
   26. DEVELOPMENT API
   ============================================================ */

/*
   Browser console:

       TutorialDefinitionVisual.reload()

   Reloads JSON and rerenders the page.
*/

window.TutorialDefinitionVisual = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};