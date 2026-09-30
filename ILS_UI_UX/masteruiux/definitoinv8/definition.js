/* ============================================================
   TUTORIAL ENGINE
   DEFINITION + COMPLETE LEARNING CARD

   VARIANT 08

   Responsibilities:

   1. Load JSON
   2. Validate JSON
   3. Render page header
   4. Render definition
   5. Render explanation
   6. Render dynamic characteristics
   7. Render dynamic visual concept
   8. Render dynamic code example
   9. Render VS Code-style syntax highlighting
   10. Render macOS terminal controls
   11. Render terminal output
   12. Render example explanation
   13. Render key takeaway
   14. Handle errors

   IMPORTANT:

   Content belongs in JSON.

   This JavaScript file is the reusable renderer.

   VISUAL MODEL:

   Supports BOTH:

   A. visual.rows
   B. visual.nodes

   This makes the visual component reusable for
   different tutorial concepts.
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
      "definitionCompletePage"
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

  characteristics:
    document.getElementById(
      "characteristics"
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

  exampleIntroduction:
    document.getElementById(
      "exampleIntroduction"
    ),

  codeExample:
    document.getElementById(
      "codeExample"
    ),

  exampleExplanation:
    document.getElementById(
      "exampleExplanation"
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
   4. INITIALIZE
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
      "Complete Learning Card Engine Error:",
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

  catch {

    throw new Error(
      "definition.json contains invalid JSON."
    );

  }

}


/* ============================================================
   6. VALIDATE DATA
   ============================================================ */

function validateData(
  data
) {

  /* ----------------------------------------------------------
     ROOT
     ---------------------------------------------------------- */

  if (
    !data ||
    typeof data !== "object"
  ) {

    throw new Error(
      "Tutorial data must be a JSON object."
    );

  }


  /* ----------------------------------------------------------
     PAGE
     ---------------------------------------------------------- */

  if (
    !data.page ||
    typeof data.page !== "object"
  ) {

    throw new Error(
      "Missing required 'page' object."
    );

  }


  /* ----------------------------------------------------------
     REQUIRED PAGE FIELDS
     ---------------------------------------------------------- */

  const requiredFields = [

    "category",
    "title",
    "introduction",
    "definition",
    "explanation",
    "characteristics",
    "visual",
    "example",
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


  /* ----------------------------------------------------------
     CHARACTERISTICS
     ---------------------------------------------------------- */

  if (
    !Array.isArray(
      data.page.characteristics
    )
  ) {

    throw new Error(
      "'characteristics' must be an array."
    );

  }


  /* ----------------------------------------------------------
     VISUAL OBJECT
     ---------------------------------------------------------- */

  if (
    !data.page.visual ||
    typeof data.page.visual !== "object"
  ) {

    throw new Error(
      "'visual' must be an object."
    );

  }


  /*
   * ----------------------------------------------------------
   * IMPORTANT FIX
   *
   * The JSON currently uses:
   *
   * visual.rows
   *
   * Therefore we MUST NOT require visual.nodes.
   *
   * The renderer supports both:
   *
   * visual.rows
   *
   * and
   *
   * visual.nodes
   *
   * ----------------------------------------------------------
   */

  const hasRows =
    Array.isArray(
      data.page.visual.rows
    );


  const hasNodes =
    Array.isArray(
      data.page.visual.nodes
    );


  if (
    !hasRows &&
    !hasNodes
  ) {

    throw new Error(
      "'visual.rows' or 'visual.nodes' must be an array."
    );

  }


  /* ----------------------------------------------------------
     VISUAL ROW VALIDATION
     ---------------------------------------------------------- */

  if (
    hasRows
  ) {

    data.page.visual.rows.forEach(
      (row, rowIndex) => {

        if (
          !Array.isArray(row)
        ) {

          throw new Error(
            `'visual.rows[${rowIndex}]' must be an array.`
          );

        }

      }
    );

  }


  /* ----------------------------------------------------------
     VISUAL NODE VALIDATION
     ---------------------------------------------------------- */

  if (
    hasNodes
  ) {

    data.page.visual.nodes.forEach(
      (node, nodeIndex) => {

        if (
          !node ||
          typeof node !== "object"
        ) {

          throw new Error(
            `'visual.nodes[${nodeIndex}]' must be an object.`
          );

        }

      }
    );

  }


  /* ----------------------------------------------------------
     EXAMPLE
     ---------------------------------------------------------- */

  if (
    !data.page.example ||
    typeof data.page.example !== "object"
  ) {

    throw new Error(
      "'example' must be an object."
    );

  }


  /* ----------------------------------------------------------
     CODE
     ---------------------------------------------------------- */

  if (
    !Array.isArray(
      data.page.example.code
    )
  ) {

    throw new Error(
      "'example.code' must be an array."
    );

  }

}


/* ============================================================
   7. RENDER PAGE
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
     CHARACTERISTICS
     ---------------------------------------------------------- */

  renderCharacteristics(
    page.characteristics
  );


  /* ----------------------------------------------------------
     VISUAL
     ---------------------------------------------------------- */

  renderVisual(
    page.visual
  );


  /* ----------------------------------------------------------
     EXAMPLE
     ---------------------------------------------------------- */

  setContent(
    DOM.exampleIntroduction,
    page.example.introduction
  );


  renderCodeExample(
    page.example
  );


  renderContent(
    DOM.exampleExplanation,
    page.example.explanation
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

  }

}


/* ============================================================
   10. PARAGRAPH
   ============================================================ */

function appendParagraph(
  container,
  content
) {

  const element =
    document.createElement(
      "p"
    );


  setContent(
    element,
    content
  );


  container.appendChild(
    element
  );

}


/* ============================================================
   11. HEADING
   ============================================================ */

function appendHeading(
  container,
  content
) {

  const element =
    document.createElement(
      "h3"
    );


  setContent(
    element,
    content
  );


  container.appendChild(
    element
  );

}


/* ============================================================
   12. NOTE
   ============================================================ */

function appendNote(
  container,
  content
) {

  const element =
    document.createElement(
      "p"
    );


  element.className =
    "explanation-note";


  setContent(
    element,
    content
  );


  container.appendChild(
    element
  );

}


/* ============================================================
   13. SIMPLE CODE BLOCK
   ============================================================ */

function appendCode(
  container,
  content
) {

  const pre =
    document.createElement(
      "pre"
    );


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
   14. CHARACTERISTICS
   ============================================================ */

function renderCharacteristics(
  characteristics
) {

  if (!DOM.characteristics) {

    return;

  }


  DOM.characteristics.innerHTML =
    "";


  characteristics.forEach(
    (item, index) => {

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
        "characteristic-card";


      /* ------------------------------------------------------
         HEADER
         ------------------------------------------------------ */

      const header =
        document.createElement(
          "div"
        );


      header.className =
        "characteristic-header";


      /* ------------------------------------------------------
         ICON
         ------------------------------------------------------ */

      const icon =
        document.createElement(
          "span"
        );


      icon.className =
        "characteristic-icon";


      const iconElement =
        document.createElement(
          "i"
        );


      setIconClasses(
        iconElement,
        item.icon ||
        "fa-solid fa-check"
      );


      icon.appendChild(
        iconElement
      );


      header.appendChild(
        icon
      );


      /* ------------------------------------------------------
         TITLE
         ------------------------------------------------------ */

      const title =
        document.createElement(
          "span"
        );


      title.className =
        "characteristic-title";


      setContent(
        title,
        item.title ||
        `Characteristic ${index + 1}`
      );


      header.appendChild(
        title
      );


      card.appendChild(
        header
      );


      /* ------------------------------------------------------
         DESCRIPTION
         ------------------------------------------------------ */

      const description =
        document.createElement(
          "div"
        );


      description.className =
        "characteristic-description";


      setContent(
        description,
        item.description ||
        ""
      );


      card.appendChild(
        description
      );


      DOM.characteristics.appendChild(
        card
      );

    }
  );

}


/* ============================================================
   15. VISUAL CONCEPT
   ============================================================ */

function renderVisual(
  visual
) {

  if (!DOM.visualModel) {

    return;

  }


  /* ----------------------------------------------------------
     INTRODUCTION
     ---------------------------------------------------------- */

  setContent(
    DOM.visualIntroduction,
    visual.introduction ||
    ""
  );


  /* ----------------------------------------------------------
     CLEAR EXISTING VISUAL
     ---------------------------------------------------------- */

  DOM.visualModel.innerHTML =
    "";


  /* ----------------------------------------------------------
     WRAPPER
     ---------------------------------------------------------- */

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "visual-model-wrapper";


  /*
   * ----------------------------------------------------------
   * GENERIC VISUAL MODEL
   *
   * Priority:
   *
   * 1. visual.rows
   * 2. visual.nodes
   *
   * This allows future JSON content to change
   * the visual structure without changing the
   * rendering engine.
   * ----------------------------------------------------------
   */

  if (
    Array.isArray(
      visual.rows
    )
  ) {

    visual.rows.forEach(
      row => {

        const rowElement =
          createVisualRow(
            row
          );


        wrapper.appendChild(
          rowElement
        );

      }
    );

  }

  else if (
    Array.isArray(
      visual.nodes
    )
  ) {

    const rowElement =
      createVisualRow(
        visual.nodes
      );


    wrapper.appendChild(
      rowElement
    );

  }


  DOM.visualModel.appendChild(
    wrapper
  );


  /* ----------------------------------------------------------
     VISUAL EXPLANATION
     ---------------------------------------------------------- */

  renderContent(
    DOM.visualExplanation,
    visual.explanation ||
    ""
  );

}


/* ============================================================
   16. CREATE VISUAL ROW
   ============================================================ */

function createVisualRow(
  items
) {

  const row =
    document.createElement(
      "div"
    );


  row.className =
    "visual-model-row";


  if (
    !Array.isArray(items)
  ) {

    return row;

  }


  items.forEach(
    item => {

      if (
        !item ||
        typeof item !== "object"
      ) {

        return;

      }


      /* ------------------------------------------------------
         CONNECTOR
         ------------------------------------------------------ */

      if (
        item.type === "connector"
      ) {

        row.appendChild(
          createVisualConnector(
            item
          )
        );

        return;

      }


      /* ------------------------------------------------------
         NODE
         ------------------------------------------------------ */

      if (
        item.type === "node" ||
        !item.type
      ) {

        row.appendChild(
          createVisualNode(
            item
          )
        );

      }

    }
  );


  return row;

}


/* ============================================================
   17. CREATE VISUAL NODE
   ============================================================ */

function createVisualNode(
  node
) {

  const article =
    document.createElement(
      "article"
    );


  article.className =
    "visual-node";


  if (
    node.highlight === true
  ) {

    article.classList.add(
      "highlight"
    );

  }


  /* ----------------------------------------------------------
     ICON
     ---------------------------------------------------------- */

  if (
    node.icon
  ) {

    const icon =
      document.createElement(
        "span"
      );


    icon.className =
      "visual-node-icon";


    const iconElement =
      document.createElement(
        "i"
      );


    setIconClasses(
      iconElement,
      node.icon
    );


    icon.appendChild(
      iconElement
    );


    article.appendChild(
      icon
    );

  }


  /* ----------------------------------------------------------
     TITLE
     ---------------------------------------------------------- */

  if (
    node.title
  ) {

    const title =
      document.createElement(
        "span"
      );


    title.className =
      "visual-node-title";


    setContent(
      title,
      node.title
    );


    article.appendChild(
      title
    );

  }


  /* ----------------------------------------------------------
     DESCRIPTION
     ---------------------------------------------------------- */

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


    article.appendChild(
      description
    );

  }


  return article;

}


/* ============================================================
   18. CREATE VISUAL CONNECTOR
   ============================================================ */

function createVisualConnector(
  connector
) {

  const element =
    document.createElement(
      "span"
    );


  element.className =
    "visual-connector";


  if (
    connector.direction ===
    "vertical"
  ) {

    element.classList.add(
      "vertical"
    );

  }


  const icon =
    document.createElement(
      "i"
    );


  const defaultIcon =
    connector.direction ===
    "vertical"

      ? "fa-solid fa-arrow-down"

      : "fa-solid fa-arrow-right";


  setIconClasses(
    icon,
    connector.icon ||
    defaultIcon
  );


  element.appendChild(
    icon
  );


  return element;

}


/* ============================================================
   19. CODE EXAMPLE
   ============================================================ */

function renderCodeExample(
  example
) {

  if (!DOM.codeExample) {

    return;

  }


  DOM.codeExample.innerHTML =
    "";


  const card =
    document.createElement(
      "div"
    );


  card.className =
    "code-example-card";


  /* ----------------------------------------------------------
     TERMINAL HEADER
     ---------------------------------------------------------- */

  const header =
    document.createElement(
      "div"
    );


  header.className =
    "code-terminal-header";


  header.setAttribute(
    "aria-label",
    "Code editor window"
  );


  header.appendChild(
    createTerminalControl(
      "close"
    )
  );


  header.appendChild(
    createTerminalControl(
      "minimize"
    )
  );


  header.appendChild(
    createTerminalControl(
      "maximize"
    )
  );


  const terminalTitle =
    document.createElement(
      "span"
    );


  terminalTitle.className =
    "terminal-title";


  setText(
    terminalTitle,
    example.filename ||
    "example.py"
  );


  header.appendChild(
    terminalTitle
  );


  card.appendChild(
    header
  );


  /* ----------------------------------------------------------
     TERMINAL BODY
     ---------------------------------------------------------- */

  const body =
    document.createElement(
      "div"
    );


  body.className =
    "code-terminal-body";


  const codeBlock =
    document.createElement(
      "code"
    );


  codeBlock.className =
    "code-block";


  example.code.forEach(
    (line, index) => {

      codeBlock.appendChild(
        createCodeLine(
          line,
          index + 1
        )
      );

    }
  );


  body.appendChild(
    codeBlock
  );


  /* ----------------------------------------------------------
     OUTPUT
     ---------------------------------------------------------- */

  if (
    example.output
  ) {

    body.appendChild(
      createCodeOutput(
        example.output
      )
    );

  }


  /* ----------------------------------------------------------
     DESCRIPTION
     ---------------------------------------------------------- */

  if (
    example.description
  ) {

    const description =
      document.createElement(
        "p"
      );


    description.className =
      "code-description";


    setContent(
      description,
      example.description
    );


    body.appendChild(
      description
    );

  }


  card.appendChild(
    body
  );


  DOM.codeExample.appendChild(
    card
  );

}


/* ============================================================
   20. TERMINAL CONTROL
   ============================================================ */

function createTerminalControl(
  type
) {

  const control =
    document.createElement(
      "span"
    );


  control.className =
    `terminal-control ${type}`;


  control.setAttribute(
    "aria-hidden",
    "true"
  );


  return control;

}


/* ============================================================
   21. CODE LINE
   ============================================================ */

function createCodeLine(
  line,
  lineNumber
) {

  const element =
    document.createElement(
      "span"
    );


  element.className =
    "code-line";


  /* ----------------------------------------------------------
     LINE NUMBER
     ---------------------------------------------------------- */

  const number =
    document.createElement(
      "span"
    );


  number.className =
    "code-line-number";


  number.setAttribute(
    "aria-hidden",
    "true"
  );


  setText(
    number,
    lineNumber
  );


  element.appendChild(
    number
  );


  /* ----------------------------------------------------------
     CODE CONTENT
     ---------------------------------------------------------- */

  const content =
    document.createElement(
      "span"
    );


  if (
    line &&
    Array.isArray(
      line.tokens
    )
  ) {

    line.tokens.forEach(
      token => {

        appendSyntaxToken(
          content,
          token
        );

      }
    );

  }

  else {

    setText(
      content,
      getLineContent(
        line
      )
    );

  }


  element.appendChild(
    content
  );


  return element;

}


/* ============================================================
   22. GET LINE CONTENT
   ============================================================ */

function getLineContent(
  line
) {

  if (
    typeof line === "string"
  ) {

    return line;

  }


  if (
    line &&
    typeof line.content === "string"
  ) {

    return line.content;

  }


  return "";

}


/* ============================================================
   23. SYNTAX TOKEN
   ============================================================ */

function appendSyntaxToken(
  container,
  token
) {

  if (
    typeof token === "string"
  ) {

    container.appendChild(
      document.createTextNode(
        token
      )
    );

    return;

  }


  if (
    !token ||
    typeof token !== "object"
  ) {

    return;

  }


  const value =
    token.value == null
      ? ""
      : String(
          token.value
        );


  if (
    !token.type
  ) {

    container.appendChild(
      document.createTextNode(
        value
      )
    );

    return;

  }


  const span =
    document.createElement(
      "span"
    );


  span.className =
    `syntax-${sanitizeClassName(
      token.type
    )}`;


  setText(
    span,
    value
  );


  container.appendChild(
    span
  );

}


/* ============================================================
   24. CODE OUTPUT
   ============================================================ */

function createCodeOutput(
  output
) {

  const container =
    document.createElement(
      "div"
    );


  container.className =
    "code-output";


  const label =
    document.createElement(
      "span"
    );


  label.className =
    "code-output-label";


  setText(
    label,
    output.label ||
    "Terminal Output"
  );


  container.appendChild(
    label
  );


  const value =
    document.createElement(
      "span"
    );


  value.className =
    "code-output-value";


  setText(
    value,
    output.value == null
      ? ""
      : output.value
  );


  container.appendChild(
    value
  );


  return container;

}


/* ============================================================
   25. SANITIZE CLASS
   ============================================================ */

function sanitizeClassName(
  value
) {

  return String(
    value
  )
    .toLowerCase()
    .replace(
      /[^a-z0-9_-]/g,
      ""
    );

}


/* ============================================================
   26. ICON CLASSES
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
   27. SET TEXT
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
   28. SET TRUSTED CONTENT
   ============================================================ */

function setContent(
  element,
  value
) {

  if (!element) {

    return;

  }


  /*
   * Tutorial JSON intentionally supports trusted
   * inline markup such as:
   *
   * <code>input()</code>
   * <strong>important</strong>
   */

  element.innerHTML =
    value == null
      ? ""
      : String(value);

}


/* ============================================================
   29. DOCUMENT TITLE
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
   30. ERROR STATE
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
   31. ESCAPE HTML
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
   32. DEVELOPMENT API
   ============================================================ */

window.TutorialDefinitionComplete = {

  reload:
    initializePage,

  loadData:
    loadData,

  render:
    renderPage

};