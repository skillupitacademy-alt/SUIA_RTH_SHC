/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + TECHNICAL BREAKDOWN

   VARIANT 06

   Responsibilities:

   1. Load JSON
   2. Validate JSON
   3. Render page content
   4. Render explanation
   5. Render terminology cards
   6. Render technical explanation
   7. Render technical code examples
   8. Render key technical points
   9. Render takeaway
   10. Handle loading errors

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
      "definitionTechnicalPage"
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

  terminology:
    document.getElementById(
      "terminology"
    ),

  technicalExplanation:
    document.getElementById(
      "technicalExplanation"
    ),

  technicalPoints:
    document.getElementById(
      "technicalPoints"
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
      "Definition + Technical Breakdown Engine Error:",
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
      "definition-technical.json contains invalid JSON."
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
    "technical",
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
    !data.page.technical ||
    typeof data.page.technical !== "object"
  ) {

    throw new Error(
      "'technical' must be an object."
    );

  }


  const technicalFields = [

    "terminology",
    "explanation",
    "points"

  ];


  technicalFields.forEach(
    field => {

      if (
        data.page.technical[field] === undefined ||
        data.page.technical[field] === null
      ) {

        throw new Error(
          `Missing required technical field: ${field}`
        );

      }

    }
  );


  if (
    !Array.isArray(
      data.page.technical.terminology
    )
  ) {

    throw new Error(
      "'technical.terminology' must be an array."
    );

  }


  if (
    !Array.isArray(
      data.page.technical.points
    )
  ) {

    throw new Error(
      "'technical.points' must be an array."
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

  renderContent(
    DOM.explanation,
    page.explanation
  );


  /* ----------------------------------------------------------
     TECHNICAL BREAKDOWN
     ---------------------------------------------------------- */

  renderTerminology(
    page.technical.terminology
  );


  renderTechnicalExplanation(
    page.technical.explanation
  );


  renderTechnicalPoints(
    page.technical.points
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
   8. GENERIC CONTENT RENDERER
   ============================================================ */

function renderContent(
  container,
  content
) {

  if (!container) {

    return;

  }


  container.innerHTML =
    "";


  if (
    typeof content === "string"
  ) {

    appendParagraph(
      container,
      content
    );

    return;

  }


  if (
    Array.isArray(content)
  ) {

    content.forEach(
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
    "Content must be a string or array."
  );

}


/* ============================================================
   9. CONTENT ITEM
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


    case "code":

      appendCode(
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
   13. APPEND CODE
   ============================================================ */

function appendCode(
  container,
  content
) {

  const pre =
    document.createElement(
      "pre"
    );


  pre.className =
    "technical-code";


  const code =
    document.createElement(
      "code"
    );


  setText(
    code,
    content
  );


  pre.appendChild(
    code
  );


  container.appendChild(
    pre
  );

}


/* ============================================================
   14. RENDER TERMINOLOGY
   ============================================================ */

function renderTerminology(
  terminology
) {

  if (!DOM.terminology) {

    return;

  }


  DOM.terminology.innerHTML =
    "";


  terminology.forEach(
    item => {

      if (
        !item ||
        typeof item !== "object"
      ) {

        return;

      }


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "terminology-card";


      /* ------------------------------------------------------
         TERM NAME
         ------------------------------------------------------ */

      const name =
        document.createElement(
          "span"
        );


      name.className =
        "terminology-name";


      setContent(
        name,
        item.term ||
        item.name ||
        ""
      );


      card.appendChild(
        name
      );


      /* ------------------------------------------------------
         TERM DESCRIPTION
         ------------------------------------------------------ */

      const description =
        document.createElement(
          "div"
        );


      description.className =
        "terminology-description";


      setContent(
        description,
        item.description ||
        ""
      );


      card.appendChild(
        description
      );


      DOM.terminology.appendChild(
        card
      );

    }
  );

}


/* ============================================================
   15. RENDER TECHNICAL EXPLANATION
   ============================================================ */

function renderTechnicalExplanation(
  explanation
) {

  if (!DOM.technicalExplanation) {

    return;

  }


  DOM.technicalExplanation.innerHTML =
    "";


  /*
   * String.
   */

  if (
    typeof explanation === "string"
  ) {

    appendParagraph(
      DOM.technicalExplanation,
      explanation
    );

    return;

  }


  /*
   * Array.
   */

  if (
    Array.isArray(explanation)
  ) {

    explanation.forEach(
      item => {

        renderTechnicalExplanationItem(
          DOM.technicalExplanation,
          item
        );

      }
    );

    return;

  }


  throw new Error(
    "'technical.explanation' must be a string or array."
  );

}


/* ============================================================
   16. TECHNICAL EXPLANATION ITEM
   ============================================================ */

function renderTechnicalExplanationItem(
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

      appendTechnicalHeading(
        container,
        item.content || ""
      );

      break;


    case "code":

      appendCode(
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
   17. TECHNICAL HEADING
   ============================================================ */

function appendTechnicalHeading(
  container,
  content
) {

  const heading =
    document.createElement(
      "h4"
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
   18. RENDER KEY TECHNICAL POINTS
   ============================================================ */

function renderTechnicalPoints(
  points
) {

  if (!DOM.technicalPoints) {

    return;

  }


  DOM.technicalPoints.innerHTML =
    "";


  points.forEach(
    (point, index) => {

      if (
        typeof point === "string"
      ) {

        createTechnicalPoint(
          DOM.technicalPoints,
          {
            content:
              point
          },
          index
        );

        return;

      }


      if (
        point &&
        typeof point === "object"
      ) {

        createTechnicalPoint(
          DOM.technicalPoints,
          point,
          index
        );

      }

    }
  );

}


/* ============================================================
   19. CREATE TECHNICAL POINT
   ============================================================ */

function createTechnicalPoint(
  container,
  point,
  index
) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "technical-point";


  /* ----------------------------------------------------------
     ICON
     ---------------------------------------------------------- */

  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "technical-point-icon";


  const iconElement =
    document.createElement(
      "i"
    );


  setIconClasses(
    iconElement,
    point.icon ||
    "fa-solid fa-check"
  );


  icon.appendChild(
    iconElement
  );


  article.appendChild(
    icon
  );


  /* ----------------------------------------------------------
     CONTENT
     ---------------------------------------------------------- */

  const content =
    document.createElement(
      "div"
    );


  content.className =
    "technical-point-content";


  /*
   * Optional title.
   */

  if (
    point.title
  ) {

    const strong =
      document.createElement(
        "strong"
      );


    setContent(
      strong,
      point.title
    );


    content.appendChild(
      strong
    );


    /*
     * Add separator when body also exists.
     */

    if (
      point.content
    ) {

      content.appendChild(
        document.createTextNode(
          " — "
        )
      );

    }

  }


  /*
   * Point body.
   */

  if (
    point.content
  ) {

    const body =
      document.createElement(
        "span"
      );


    setContent(
      body,
      point.content
    );


    content.appendChild(
      body
    );

  }


  article.appendChild(
    content
  );


  container.appendChild(
    article
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


  /*
   * Tutorial content can intentionally contain
   * trusted inline markup such as:

       <code>variable</code>

   * or:

       <strong>important</strong>
   */

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

       TutorialDefinitionTechnical.reload()

   Reloads the JSON and rerenders the page.
*/

window.TutorialDefinitionTechnical = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};