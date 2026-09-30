/* ============================================================
   SUIA TUTORIAL ENGINE
   CODE PAGE JAVASCRIPT

   GENERIC ARCHITECTURE

   JSON
     ↓
   Educational data / model definition
     ↓
   JavaScript renderer
     ↓
   HTML
     ↓
   CSS visual presentation


   MEMORY / MODEL ARCHITECTURE

   The renderer does NOT assume:

       Variable → Object → Value


   Instead it understands:

       nodes
       columns
       rows
       connections
       variants
       layout


   This allows future models such as:

       reference-flow
       aliasing
       stack-heap
       object-layout
       call-stack
       garbage-collection
       dictionary-hashing
       list-memory
       class-instance
       event-loop
       etc.

   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const CONTENT_FILE =
  "code.json";


/* ============================================================
   2. DOM HELPERS
   ============================================================ */

function getElement(id) {

  return document.getElementById(id);

}


/* ============================================================
   SET TEXT SAFELY
   ============================================================ */

function setText(
  id,
  value
) {

  const element =
    getElement(id);


  if (!element) {
    return;
  }


  element.textContent =
    value === undefined ||
    value === null
      ? ""
      : String(value);

}


/* ============================================================
   HTML ESCAPE
   ============================================================ */

function escapeHTML(value) {

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
   INLINE MARKUP

   Supports JSON content such as:

       The <code>input()</code> function...

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
   3. INITIALIZATION
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

    console.log(
      "[Tutorial Engine] Loading code content..."
    );


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
        "Invalid code page JSON structure."
      );

    }


    renderCodePage(
      data
    );


    console.log(
      "[Tutorial Engine] Code page loaded successfully."
    );


  } catch (error) {

    console.error(
      "[Tutorial Engine] Code page loading failed:",
      error
    );


    showPageError(
      error.message ||
      "Unable to load tutorial content."
    );

  }

}


/* ============================================================
   4. RENDER COMPLETE PAGE
   ============================================================ */

function renderCodePage(
  data
) {

  renderHeader(
    data
  );


  renderCode(
    data
  );


  renderExplanation(
    data
  );


  renderOutput(
    data
  );


  renderMemoryModel(
    data
  );


  renderTakeaway(
    data
  );


  renderTip(
    data
  );


  initializeCopyButton();

}


/* ============================================================
   5. PAGE HEADER
   ============================================================ */

function renderHeader(
  data
) {

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
   6. CODE RENDERER
   ============================================================ */

function renderCode(
  data
) {

  const code =
    data.code || {};


  const codeElement =
    getElement(
      "codeBlock"
    );


  if (!codeElement) {
    return;
  }


  setText(
    "codeLanguage",
    code.language ||
    "Code"
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
   7. PRISM HIGHLIGHTING
   ============================================================ */

function highlightCode(
  codeElement
) {

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


  let attempts =
    0;


  const maxAttempts =
    30;


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


          return;

        }


        if (
          attempts >=
          maxAttempts
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
   8. EXPLANATION
   ============================================================ */

function renderExplanation(
  data
) {

  const explanation =
    data.explanation ||
    {};


  const container =
    getElement(
      "explanationTable"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  const steps =
    Array.isArray(
      explanation.steps
    )
      ? explanation.steps
      : [];


  steps.forEach(
    (
      step,
      index
    ) => {

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
   9. OUTPUT
   ============================================================ */

function renderOutput(
  data
) {

  const output =
    data.output ||
    {};


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
   10. GENERIC MEMORY MODEL
   ============================================================

   Supported JSON:

   memoryModel: {

      type: "reference-flow",

      layout: {
          type: "grid"
      },

      columns: [
          {
              id: "variables",
              title: "Variables (References)"
          },
          {
              id: "objects",
              title: "Objects in Memory"
          },
          {
              id: "values",
              title: "Values"
          }
      ],

      nodes: [

          {
              id: "x",
              label: "x",
              column: "variables",
              row: 1,
              variant: "reference"
          },

          {
              id: "object-x",
              label: "id: 140...",
              column: "objects",
              row: 1,
              variant: "object"
          },

          {
              id: "value-x",
              label: "10 (int)",
              column: "values",
              row: 1,
              variant: "value"
          }

      ],

      connections: [

          {
              from: "x",
              to: "object-x",
              type: "reference"
          },

          {
              from: "object-x",
              to: "value-x",
              type: "value"
          }

      ]

   }

   ============================================================ */

function renderMemoryModel(
  data
) {

  const memory =
    data.memoryModel ||
    {};


  const description =
    memory.description ||
    "";


  setText(
    "memoryDescription",
    description
  );


  const container =
    getElement(
      "memoryModel"
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    "";


  /*
   * If the new generic model exists,
   * use it.
   */

  if (
    Array.isArray(
      memory.nodes
    )
  ) {

    renderGenericMemoryModel(
      memory,
      container
    );


    return;

  }


  /*
   * Backward compatibility.

   * The old JSON used:

       memory.rows

   * Convert that structure into the
   * new generic representation.

   */

  if (
    Array.isArray(
      memory.rows
    )
  ) {

    const genericMemory =
      convertLegacyMemoryModel(
        memory
      );


    renderGenericMemoryModel(
      genericMemory,
      container
    );


    return;

  }


  /*
   * Nothing to render.
   */

  renderEmptyMemoryModel(
    container
  );

}


/* ============================================================
   11. LEGACY → GENERIC ADAPTER
   ============================================================

   This allows the current code.json to continue working
   while we migrate to the new schema.

   OLD:

       rows: [
          {
             variable,
             objectId,
             value
          }
       ]

   NEW:

       nodes
       connections

   ============================================================ */

function convertLegacyMemoryModel(
  memory
) {

  const columns = [

    {
      id:
        "variables",

      title:
        memory.columnHeaders?.variables ||
        "Variables (References)"
    },


    {
      id:
        "objects",

      title:
        memory.columnHeaders?.objects ||
        "Objects in Memory"
    },


    {
      id:
        "values",

      title:
        memory.columnHeaders?.values ||
        "Values"
    }

  ];


  const nodes =
    [];


  const connections =
    [];


  const rows =
    Array.isArray(
      memory.rows
    )
      ? memory.rows
      : [];


  rows.forEach(
    (
      row,
      index
    ) => {

      const rowNumber =
        index + 1;


      const variableId =
        `legacy-variable-${index}`;


      const objectId =
        `legacy-object-${index}`;


      const valueId =
        `legacy-value-${index}`;


      const isResult =
        index ===
        rows.length - 1;


      nodes.push({

        id:
          variableId,

        label:
          row.variable ||
          "",

        column:
          "variables",

        row:
          rowNumber,

        variant:
          isResult
            ? "result"
            : "reference",

        monospace:
          true

      });


      nodes.push({

        id:
          objectId,

        label:
          row.objectId ||
          "",

        column:
          "objects",

        row:
          rowNumber,

        variant:
          isResult
            ? "result"
            : "object",

        monospace:
          true

      });


      nodes.push({

        id:
          valueId,

        label:
          row.value ||
          "",

        column:
          "values",

        row:
          rowNumber,

        variant:
          isResult
            ? "result"
            : "value",

        monospace:
          true

      });


      connections.push({

        id:
          `legacy-reference-${index}`,

        from:
          variableId,

        to:
          objectId,

        type:
          "reference"

      });


      connections.push({

        id:
          `legacy-value-${index}`,

        from:
          objectId,

        to:
          valueId,

        type:
          "value"

      });

    }
  );


  return {

    type:
      "reference-flow",

    description:
      memory.description ||
      "",

    layout: {

      type:
        "grid"

    },

    columns,

    nodes,

    connections

  };

}


/* ============================================================
   12. GENERIC MEMORY RENDERER
   ============================================================ */

function renderGenericMemoryModel(
  memory,
  container
) {

  const columns =
    normalizeMemoryColumns(
      memory.columns ||
      memory.columnHeaders
    );


  const nodes =
    normalizeMemoryNodes(
      memory.nodes
    );


  const connections =
    Array.isArray(
      memory.connections
    )
      ? memory.connections
      : [];


  if (
    nodes.length === 0
  ) {

    renderEmptyMemoryModel(
      container
    );


    return;

  }


  const diagram =
    document.createElement(
      "div"
    );


  diagram.className =
    "memory-diagram";


  diagram.dataset.modelType =
    memory.type ||
    "generic";


  diagram.dataset.layoutType =
    memory.layout?.type ||
    "grid";


  /*
   * Render according to layout.
   */

  const layoutType =
    memory.layout?.type ||
    "grid";


  if (
    layoutType ===
    "freeform"
  ) {

    renderFreeformMemoryLayout(
      diagram,
      columns,
      nodes
    );

  } else {

    renderGridMemoryLayout(
      diagram,
      columns,
      nodes
    );

  }


  /*
   * Connections are rendered AFTER nodes.

   * This allows us to measure actual node positions.
   */

  const connectionLayer =
    document.createElement(
      "div"
    );


  connectionLayer.className =
    "memory-connections";


  diagram.appendChild(
    connectionLayer
  );


  container.appendChild(
    diagram
  );


  /*
   * Browser must complete layout before measuring
   * node coordinates.
   */

  requestAnimationFrame(
    () => {

      renderMemoryConnections(
        diagram,
        connectionLayer,
        connections
      );

    }
  );


  /*
   * Note is optional.
   */

  renderMemoryNote(
    memory
  );

}


/* ============================================================
   13. NORMALIZE COLUMNS
   ============================================================ */

function normalizeMemoryColumns(
  columns
) {

  /*
   * New format:

       columns: [
          {
             id,
             title
          }
       ]

   */

  if (
    Array.isArray(
      columns
    )
  ) {

    return columns
      .map(
        (
          column,
          index
        ) => {

          if (
            typeof column ===
            "string"
          ) {

            return {

              id:
                slugify(
                  column
                ) ||
                `column-${index + 1}`,

              title:
                column

            };

          }


          return {

            id:
              column.id ||
              `column-${index + 1}`,

            title:
              column.title ||
              column.name ||
              `Column ${index + 1}`,

            width:
              column.width ||
              null

          };

        }
      );

  }


  /*
   * Legacy columnHeaders object.
   */

  if (
    columns &&
    typeof columns ===
    "object"
  ) {

    return [

      {
        id:
          "variables",

        title:
          columns.variables ||
          "Variables"

      },


      {
        id:
          "objects",

        title:
          columns.objects ||
          "Objects"

      },


      {
        id:
          "values",

        title:
          columns.values ||
          "Values"

      }

    ];

  }


  return [];

}


/* ============================================================
   14. NORMALIZE NODES
   ============================================================ */

function normalizeMemoryNodes(
  nodes
) {

  if (
    !Array.isArray(
      nodes
    )
  ) {

    return [];

  }


  return nodes
    .filter(
      node =>
        node &&
        typeof node ===
        "object"
    )
    .map(
      (
        node,
        index
      ) => {

        return {

          ...node,

          id:
            String(
              node.id ||
              `node-${index + 1}`
            ),

          label:
            node.label ??
            node.name ??
            "",

          column:
            node.column ??
            node.group ??
            null,

          row:
            Number(
              node.row ||
              index + 1
            ),

          variant:
            node.variant ||
            node.style ||
            "reference"

        };

      }
    );

}


/* ============================================================
   15. GRID MEMORY LAYOUT
   ============================================================ */

function renderGridMemoryLayout(
  diagram,
  columns,
  nodes
) {

  const columnIds =
    columns.map(
      column =>
        String(
          column.id
        )
    );


  /*
   * Determine all row numbers.
   */

  const rowNumbers =
    nodes.map(
      node =>
        Number(
          node.row ||
          1
        )
    );


  const maxRow =
    Math.max(
      1,
      ...rowNumbers
    );


  /*
   * Determine column widths.

   * JSON may optionally provide:

       width: "180px"

   * Otherwise use a flexible value.
   */

  const templateColumns =
    columns.map(
      column =>
        column.width ||
        "minmax(150px, 1fr)"
    );


  diagram.style.gridTemplateColumns =
    templateColumns.join(
      " "
    );


  diagram.style.gridTemplateRows =
    `auto repeat(${maxRow}, minmax(58px, auto))`;


  /*
   * Column headers.
   */

  columns.forEach(
    (
      column,
      columnIndex
    ) => {

      const header =
        document.createElement(
          "div"
        );


      header.className =
        "memory-group-header";


      header.textContent =
        column.title ||
        column.name ||
        column.id ||
        "";


      header.dataset.column =
        String(
          column.id
        );


      header.style.gridColumn =
        String(
          columnIndex + 1
        );


      header.style.gridRow =
        "1";


      diagram.appendChild(
        header
      );

    }
  );


  /*
   * Nodes.
   */

  nodes.forEach(
    node => {

      const element =
        createMemoryNode(
          node
        );


      const columnIndex =
        columnIds.indexOf(
          String(
            node.column
          )
        );


      /*
       * If the JSON column does not exist,
       * use the explicit numeric column when supplied.
       */

      const explicitColumn =
        Number(
          node.columnIndex
        );


      let resolvedColumn =
        columnIndex >= 0
          ? columnIndex + 1
          : explicitColumn > 0
            ? explicitColumn
            : 1;


      const resolvedRow =
        Math.max(
          1,
          Number(
            node.row ||
            1
          )
        );


      /*
       * Header occupies row 1.

       * Actual node starts at row 2.
       */

      element.style.gridColumn =
        String(
          resolvedColumn
        );


      element.style.gridRow =
        String(
          resolvedRow + 1
        );


      diagram.appendChild(
        element
      );

    }
  );

}


/* ============================================================
   16. FREEFORM MEMORY LAYOUT
   ============================================================

   JSON example:

       layout: {
           type: "freeform"
       }

       node: {
           id: "stack",
           x: 10,
           y: 10
       }

   x and y are percentages.

   ============================================================ */

function renderFreeformMemoryLayout(
  diagram,
  columns,
  nodes
) {

  diagram.style.display =
    "block";


  diagram.style.minHeight =
    "320px";


  /*
   * Optional column/group labels.

   * They are positioned at the top.
   */

  columns.forEach(
    (
      column,
      index
    ) => {

      const header =
        document.createElement(
          "div"
        );


      header.className =
        "memory-group-header";


      header.textContent =
        column.title ||
        column.name ||
        column.id ||
        "";


      header.style.position =
        "absolute";


      header.style.left =
        `${column.x ?? (index * 30 + 5)}%`;


      header.style.top =
        `${column.y ?? 4}%`;


      diagram.appendChild(
        header
      );

    }
  );


  nodes.forEach(
    node => {

      const element =
        createMemoryNode(
          node
        );


      element.style.position =
        "absolute";


      element.style.left =
        `${Number(node.x ?? 0)}%`;


      element.style.top =
        `${Number(node.y ?? 20)}%`;


      element.style.width =
        node.width ||
        "180px";


      diagram.appendChild(
        element
      );

    }
  );

}


/* ============================================================
   17. CREATE MEMORY NODE
   ============================================================ */

function createMemoryNode(
  node
) {

  const element =
    document.createElement(
      "div"
    );


  element.className =
    "memory-node";


  const variant =
    normalizeVariant(
      node.variant
    );


  element.classList.add(
    `memory-node-${variant}`
  );


  element.dataset.nodeId =
    String(
      node.id
    );


  element.dataset.variant =
    variant;


  if (
    node.monospace === true
  ) {

    element.classList.add(
      "is-monospace"
    );

  }


  if (
    node.className &&
    typeof node.className ===
    "string"
  ) {

    /*
     * Only allow simple CSS class tokens.
     */

    const customClasses =
      node.className
        .split(/\s+/)
        .filter(
          className =>
            /^[a-zA-Z0-9_-]+$/.test(
              className
            )
        );


    customClasses.forEach(
      className =>
        element.classList.add(
          className
        )
    );

  }


  /*
   * Accessibility.
   */

  element.setAttribute(
    "data-node-id",
    String(
      node.id
    )
  );


  /*
   * Label.

   * textContent prevents arbitrary HTML from entering
   * the visualization.
   */

  const label =
    document.createElement(
      "span"
    );


  label.className =
    "memory-node-label";


  label.textContent =
    node.label ??
    "";


  element.appendChild(
    label
  );


  return element;

}


/* ============================================================
   18. NORMALIZE NODE VARIANT
   ============================================================ */

function normalizeVariant(
  variant
) {

  const value =
    String(
      variant ||
      "reference"
    )
      .toLowerCase()
      .trim();


  const supported = [

    "reference",
    "object",
    "value",
    "result"

  ];


  if (
    supported.includes(
      value
    )
  ) {

    return value;

  }


  /*
   * Unknown variants fall back to reference
   * while preserving the data model.
   */

  return "reference";

}


/* ============================================================
   19. RENDER CONNECTIONS
   ============================================================ */

function renderMemoryConnections(
  diagram,
  layer,
  connections
) {

  if (
    !Array.isArray(
      connections
    ) ||
    connections.length === 0
  ) {

    return;

  }


  /*
   * Clear previous connections.
   */

  layer.innerHTML =
    "";


  /*
   * Build node lookup.
   */

  const nodeMap =
    new Map();


  diagram
    .querySelectorAll(
      "[data-node-id]"
    )
    .forEach(
      element => {

        nodeMap.set(
          element.dataset.nodeId,
          element
        );

      }
    );


  /*
   * Diagram coordinates.

   * All connection geometry is calculated from
   * actual rendered node positions.

   * Therefore the renderer does NOT care where the
   * columns happen to be.
   */

  const diagramRect =
    diagram.getBoundingClientRect();


  connections.forEach(
    (
      connection,
      index
    ) => {

      if (
        !connection ||
        typeof connection !==
        "object"
      ) {

        return;

      }


      const from =
        nodeMap.get(
          String(
            connection.from
          )
        );


      const to =
        nodeMap.get(
          String(
            connection.to
          )
        );


      if (
        !from ||
        !to
      ) {

        console.warn(
          "[Memory Model] Connection references missing node:",
          connection
        );


        return;

      }


      const fromRect =
        from.getBoundingClientRect();


      const toRect =
        to.getBoundingClientRect();


      /*
       * Determine connection anchor points.

       * Default:
           right center → left center

       * But JSON can request:

           fromSide
           toSide

       * Supported:
           top
           right
           bottom
           left
           center
      */

      const fromPoint =
        getConnectionPoint(
          fromRect,
          diagramRect,
          connection.fromSide ||
          "right"
        );


      const toPoint =
        getConnectionPoint(
          toRect,
          diagramRect,
          connection.toSide ||
          "left"
        );


      drawMemoryConnection(
        layer,
        fromPoint,
        toPoint,
        connection,
        index
      );

    }
  );

}


/* ============================================================
   20. GET CONNECTION POINT
   ============================================================ */

function getConnectionPoint(
  rect,
  containerRect,
  side
) {

  const normalizedSide =
    String(
      side ||
      "center"
    )
      .toLowerCase();


  let x =
    rect.left -
    containerRect.left +
    rect.width / 2;


  let y =
    rect.top -
    containerRect.top +
    rect.height / 2;


  switch (
    normalizedSide
  ) {

    case "top":

      y =
        rect.top -
        containerRect.top;

      break;


    case "right":

      x =
        rect.right -
        containerRect.left;

      break;


    case "bottom":

      y =
        rect.bottom -
        containerRect.top;

      break;


    case "left":

      x =
        rect.left -
        containerRect.left;

      break;


    case "center":

    default:

      break;

  }


  return {
    x,
    y
  };

}


/* ============================================================
   21. DRAW CONNECTION
   ============================================================ */

function drawMemoryConnection(
  layer,
  fromPoint,
  toPoint,
  connection,
  index
) {

  const deltaX =
    toPoint.x -
    fromPoint.x;


  const deltaY =
    toPoint.y -
    fromPoint.y;


  const distance =
    Math.sqrt(
      (
        deltaX *
        deltaX
      ) +
      (
        deltaY *
        deltaY
      )
    );


  /*
   * Ignore zero-length connections.
   */

  if (
    distance <
    1
  ) {

    return;

  }


  const angle =
    Math.atan2(
      deltaY,
      deltaX
    ) *
    (
      180 /
      Math.PI
    );


  const line =
    document.createElement(
      "div"
    );


  line.className =
    "memory-connection";


  line.dataset.connectionIndex =
    String(
      index
    );


  if (
    connection.type
  ) {

    line.dataset.type =
      String(
        connection.type
      );

  }


  if (
    connection.style
  ) {

    line.dataset.style =
      String(
        connection.style
      );

  }


  line.style.left =
    `${fromPoint.x}px`;


  line.style.top =
    `${fromPoint.y}px`;


  line.style.width =
    `${distance}px`;


  line.style.transform =
    `rotate(${angle}deg)`;


  /*
   * Connection label.

   * The label is optional.
   */

  if (
    connection.label
  ) {

    const label =
      document.createElement(
        "span"
      );


    label.className =
      "memory-connection-label";


    label.textContent =
      String(
        connection.label
      );


    line.appendChild(
      label
    );

  }


  layer.appendChild(
    line
  );

}


/* ============================================================
   22. MEMORY NOTE
   ============================================================ */

function renderMemoryNote(
  memory
) {

  const noteElement =
    getElement(
      "memoryNote"
    );


  if (!noteElement) {
    return;
  }


  const note =
    memory.note ||
    memory.notes ||
    "";


  if (
    Array.isArray(
      note
    )
  ) {

    noteElement.textContent =
      note.join(
        " "
      );

  } else {

    noteElement.textContent =
      String(
        note
      );

  }

}


/* ============================================================
   23. EMPTY MEMORY MODEL
   ============================================================ */

function renderEmptyMemoryModel(
  container
) {

  const empty =
    document.createElement(
      "div"
    );


  empty.className =
    "memory-node";


  empty.classList.add(
    "memory-node-reference"
  );


  empty.textContent =
    "No memory model available.";


  container.appendChild(
    empty
  );

}


/* ============================================================
   24. TAKEAWAY
   ============================================================ */

function renderTakeaway(
  data
) {

  const takeaway =
    data.takeaway ||
    {};


  const list =
    getElement(
      "takeawayList"
    );


  if (!list) {
    return;
  }


  list.innerHTML =
    "";


  const items =
    Array.isArray(
      takeaway.items
    )
      ? takeaway.items
      : [];


  items.forEach(
    item => {

      const li =
        document.createElement(
          "li"
        );


      li.innerHTML =
        formatInlineContent(
          item
        );


      list.appendChild(
        li
      );

    }
  );

}


/* ============================================================
   25. TIP
   ============================================================ */

function renderTip(
  data
) {

  const tip =
    data.tip ||
    {};


  setText(
    "tipText",
    tip.text ||
    ""
  );

}


/* ============================================================
   26. COPY BUTTON
   ============================================================ */

function initializeCopyButton() {

  const button =
    getElement(
      "copyCodeButton"
    );


  if (!button) {
    return;
  }


  /*
   * Prevent duplicate listeners if renderer is
   * initialized more than once.
   */

  if (
    button.dataset.initialized ===
    "true"
  ) {

    return;

  }


  button.dataset.initialized =
    "true";


  button.addEventListener(
    "click",
    copyCode
  );

}


/* ============================================================
   COPY CODE
   ============================================================ */

async function copyCode() {

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
      "[Tutorial Engine] Clipboard error:",
      error
    );

  }

}


/* ============================================================
   FALLBACK COPY
   ============================================================ */

function fallbackCopy(
  text
) {

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


  textarea.style.left =
    "-9999px";


  textarea.style.top =
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

function showCopiedState(
  button
) {

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
   27. SLUGIFY
   ============================================================ */

function slugify(
  value
) {

  return String(
    value ??
    ""
  )
    .toLowerCase()
    .trim()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );

}


/* ============================================================
   28. REFLOW MEMORY CONNECTIONS
   ============================================================

   This is important for:

       browser resize
       responsive layout
       font loading
       orientation changes

   We recalculate the actual node coordinates rather than
   relying on stored positions.

   ============================================================ */

let memoryConnectionFrame =
  null;


function refreshMemoryConnections() {

  if (
    memoryConnectionFrame !==
    null
  ) {

    cancelAnimationFrame(
      memoryConnectionFrame
    );

  }


  memoryConnectionFrame =
    requestAnimationFrame(
      () => {

        document
          .querySelectorAll(
            ".memory-diagram"
          )
          .forEach(
            diagram => {

              const layer =
                diagram.querySelector(
                  ".memory-connections"
                );


              if (!layer) {
                return;
              }


              /*
               * Connections are stored as JSON on the
               * diagram element after initial render.
               */

              let connections;


              try {

                connections =
                  JSON.parse(
                    diagram.dataset.connections ||
                    "[]"
                  );

              } catch {

                connections =
                  [];

              }


              renderMemoryConnections(
                diagram,
                layer,
                connections
              );

            }
          );


        memoryConnectionFrame =
          null;

      }
    );

}


/* ============================================================
   29. STORE CONNECTION DATA

   We wrap the generic renderer's connection drawing so
   resize can reconstruct it.

   ============================================================ */

function storeMemoryConnections(
  diagram,
  connections
) {

  try {

    diagram.dataset.connections =
      JSON.stringify(
        connections
      );

  } catch {

    diagram.dataset.connections =
      "[]";

  }

}


/* ============================================================
   30. RESIZE OBSERVER
   ============================================================ */

if (
  typeof ResizeObserver !==
  "undefined"
) {

  const memoryResizeObserver =
    new ResizeObserver(
      () => {

        refreshMemoryConnections();

      }
    );


  document.addEventListener(
    "DOMContentLoaded",
    () => {

      document
        .querySelectorAll(
          ".memory-model"
        )
        .forEach(
          element => {

            memoryResizeObserver.observe(
              element
            );

          }
        );

    }
  );

}


/* ============================================================
   31. WINDOW RESIZE FALLBACK
   ============================================================ */

window.addEventListener(
  "resize",
  refreshMemoryConnections
);


/* ============================================================
   32. ERROR PAGE
   ============================================================ */

function showPageError(
  message
) {

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
            aria-hidden="true"
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
          ${escapeHTML(
            message
          )}
        </p>

      </section>
    `;

}