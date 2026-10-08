/* ============================================================
   SKILLHUBCORE ADMIN
   TUTORIAL COMPOSER

   RESPONSIBILITY SPLIT
   ------------------------------------------------------------
   curriculum.json
       → Domain
       → Subject
       → Topic
       → Subtopic

   navigation.json
       → Tutorial sidebar/navigation structure

   Uploaded JSON / Markdown
       → Tutorial content

   LEFT PANEL
       → Navigation preview

   CENTER PANEL
       → Content authoring

   RIGHT PANEL
       → Actual tutorial content preview

   NO API REQUIRED
   ============================================================ */


/* ============================================================
   CONFIGURATION
   ============================================================ */

const CONFIG = {

  curriculumFile:
    "./curriculum.json",

  navigationFile:
    "./navigation.json"

};


/* ============================================================
   APPLICATION STATE
   ============================================================ */

const state = {

  curriculum:
    null,

  navigation:
    null,

  selected: {

    domain:
      null,

    subject:
      null,

    topic:
      null,

    subtopic:
      null

  },

  content: {

    raw:
      "",

    parsed:
      null,

    format:
      null,

    valid:
      false

  }

};


/* ============================================================
   DOM REFERENCES
   ============================================================ */

const DOM = {

  domain:
    document.getElementById(
      "domainSelect"
    ),

  subject:
    document.getElementById(
      "subjectSelect"
    ),

  topic:
    document.getElementById(
      "topicSelect"
    ),

  subtopic:
    document.getElementById(
      "subtopicSelect"
    ),

  selectionPath:
    document.getElementById(
      "selectionPath"
    ),

  status:
    document.getElementById(
      "dataStatus"
    ),

  contentFile:
    document.getElementById(
      "contentFile"
    ),

  fileName:
    document.getElementById(
      "fileName"
    ),

  editor:
    document.getElementById(
      "contentEditor"
    ),

  contentFormat:
    document.getElementById(
      "contentFormat"
    ),

  validation:
    document.getElementById(
      "validationMessage"
    ),

  sidebar:
    document.getElementById(
      "sidebarPreview"
    ),

  sidebarNodeCount:
    document.getElementById(
      "sidebarNodeCount"
    ),

  preview:
    document.getElementById(
      "previewContent"
    ),

  previewTitle:
    document.getElementById(
      "previewTitle"
    ),

  previewDomain:
    document.getElementById(
      "previewDomain"
    ),

  previewSubject:
    document.getElementById(
      "previewSubject"
    ),

  previewTopic:
    document.getElementById(
      "previewTopic"
    ),

  previewSubtopic:
    document.getElementById(
      "previewSubtopic"
    ),

  publishButton:
    document.getElementById(
      "publishButton"
    ),

  publishMessage:
    document.getElementById(
      "publishMessage"
    )

};


/* ============================================================
   INITIALIZATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initialize
);


async function initialize() {

  bindEvents();

  resetSelectors();

  renderEmptySidebar();

  renderEmptyContentPreview();


  try {

    const [
      curriculum,
      navigation
    ] =
      await Promise.all([
        loadCurriculum(),
        loadNavigation()
      ]);


    validateCurriculum(
      curriculum
    );


    validateNavigation(
      navigation
    );


    state.curriculum =
      curriculum;


    state.navigation =
      navigation;


    populateDomains();


    setStatus(
      `${curriculum.domains.length} domains loaded`,
      "ready"
    );


    /*
     * Navigation data is now available.
     *
     * We do not render it yet because the
     * user has not selected a curriculum
     * location.
     */

    updateSidebarPreview();

  }

  catch (
    error
  ) {

    console.error(
      "[Tutorial Composer]",
      error
    );


    setStatus(
      "Unable to load curriculum/navigation",
      "error"
    );


    showValidationError(
      error.message
    );

  }

}


/* ============================================================
   EVENT BINDING
   ============================================================ */

function bindEvents() {

  DOM.domain.addEventListener(
    "change",
    handleDomainChange
  );


  DOM.subject.addEventListener(
    "change",
    handleSubjectChange
  );


  DOM.topic.addEventListener(
    "change",
    handleTopicChange
  );


  DOM.subtopic.addEventListener(
    "change",
    handleSubtopicChange
  );


  DOM.contentFile.addEventListener(
    "change",
    handleFileUpload
  );


  DOM.editor.addEventListener(
    "input",
    handleEditorInput
  );


  DOM.publishButton.addEventListener(
    "click",
    handleSave
  );

}


/* ============================================================
   LOAD CURRICULUM
   ============================================================ */

async function loadCurriculum() {

  const response =
    await fetch(
      CONFIG.curriculumFile,
      {
        cache:
          "no-store"
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Unable to load curriculum.json. HTTP ${response.status}`
    );

  }


  return await response.json();

}


/* ============================================================
   LOAD NAVIGATION
   ============================================================ */

async function loadNavigation() {

  const response =
    await fetch(
      CONFIG.navigationFile,
      {
        cache:
          "no-store"
      }
    );


  if (
    !response.ok
  ) {

    throw new Error(
      `Unable to load navigation.json. HTTP ${response.status}`
    );

  }


  return await response.json();

}


/* ============================================================
   VALIDATE CURRICULUM
   ============================================================ */

function validateCurriculum(
  data
) {

  if (
    !data ||
    typeof data !==
      "object"
  ) {

    throw new Error(
      "Invalid curriculum structure."
    );

  }


  if (
    !Array.isArray(
      data.domains
    )
  ) {

    throw new Error(
      "curriculum.json must contain domains[]."
    );

  }

}


/* ============================================================
   VALIDATE NAVIGATION
   ============================================================ */

function validateNavigation(
  data
) {

  if (
    !data ||
    typeof data !==
      "object"
  ) {

    throw new Error(
      "Invalid navigation structure."
    );

  }


  /*
   * Current supported structure:
   *
   * {
   *   "title": "...",
   *   "sections": []
   * }
   *
   * Future structures can also be
   * supported without changing the
   * curriculum model.
   */

  if (
    data.sections !== undefined &&
    !Array.isArray(
      data.sections
    )
  ) {

    throw new Error(
      "navigation.json sections must be an array."
    );

  }

}


/* ============================================================
   RESET SELECTORS
   ============================================================ */

function resetSelectors() {

  setOptions(
    DOM.domain,
    "Loading domains...",
    []
  );


  setOptions(
    DOM.subject,
    "Select subject",
    []
  );


  setOptions(
    DOM.topic,
    "Select topic",
    []
  );


  setOptions(
    DOM.subtopic,
    "Select subtopic",
    []
  );


  DOM.domain.disabled =
    true;

  DOM.subject.disabled =
    true;

  DOM.topic.disabled =
    true;

  DOM.subtopic.disabled =
    true;

}


/* ============================================================
   DOMAIN
   ============================================================ */

function populateDomains() {

  setOptions(
    DOM.domain,
    "Select domain",
    state.curriculum.domains
  );


  DOM.domain.disabled =
    false;

}


function handleDomainChange() {

  state.selected.domain =
    findById(
      state.curriculum.domains,
      DOM.domain.value
    );


  state.selected.subject =
    null;

  state.selected.topic =
    null;

  state.selected.subtopic =
    null;


  setOptions(
    DOM.subject,
    "Select subject",
    state.selected.domain?.subjects ||
    []
  );


  setOptions(
    DOM.topic,
    "Select topic",
    []
  );


  setOptions(
    DOM.subtopic,
    "Select subtopic",
    []
  );


  DOM.subject.disabled =
    !state.selected.domain;

  DOM.topic.disabled =
    true;

  DOM.subtopic.disabled =
    true;


  updateSelection();

}


/* ============================================================
   SUBJECT
   ============================================================ */

function handleSubjectChange() {

  state.selected.subject =
    findById(
      state.selected.domain?.subjects ||
      [],
      DOM.subject.value
    );


  state.selected.topic =
    null;

  state.selected.subtopic =
    null;


  setOptions(
    DOM.topic,
    "Select topic",
    state.selected.subject?.topics ||
    []
  );


  setOptions(
    DOM.subtopic,
    "Select subtopic",
    []
  );


  DOM.topic.disabled =
    !state.selected.subject;

  DOM.subtopic.disabled =
    true;


  updateSelection();

}


/* ============================================================
   TOPIC
   ============================================================ */

function handleTopicChange() {

  state.selected.topic =
    findById(
      state.selected.subject?.topics ||
      [],
      DOM.topic.value
    );


  state.selected.subtopic =
    null;


  setOptions(
    DOM.subtopic,
    "Select subtopic",
    state.selected.topic?.subtopics ||
    []
  );


  DOM.subtopic.disabled =
    !state.selected.topic;


  updateSelection();

}


/* ============================================================
   SUBTOPIC
   ============================================================ */

function handleSubtopicChange() {

  state.selected.subtopic =
    findById(
      state.selected.topic?.subtopics ||
      [],
      DOM.subtopic.value
    );


  updateSelection();

}


/* ============================================================
   GENERIC SELECT OPTIONS
   ============================================================ */

function setOptions(
  select,
  placeholder,
  items
) {

  select.innerHTML =
    "";


  const first =
    document.createElement(
      "option"
    );


  first.value =
    "";


  first.textContent =
    placeholder;


  select.appendChild(
    first
  );


  items.forEach(
    item => {

      const option =
        document.createElement(
          "option"
        );


      option.value =
        item.id;


      option.textContent =
        item.name;


      select.appendChild(
        option
      );

    }
  );


  select.value =
    "";

}


/* ============================================================
   FIND BY ID
   ============================================================ */

function findById(
  items,
  id
) {

  if (
    !id
  ) {

    return null;

  }


  return (
    items.find(
      item =>
        item.id === id
    ) ||
    null
  );

}


/* ============================================================
   SELECTION UPDATE
   ============================================================ */

function updateSelection() {

  const selected =
    state.selected;


  const path = [

    selected.domain?.name,

    selected.subject?.name,

    selected.topic?.name,

    selected.subtopic?.name

  ].filter(
    Boolean
  );


  DOM.selectionPath.textContent =

    path.length
      ? path.join(
          " / "
        )
      : "Nothing selected";


  DOM.previewDomain.textContent =
    selected.domain?.name ||
    "—";


  DOM.previewSubject.textContent =
    selected.subject?.name ||
    "—";


  DOM.previewTopic.textContent =
    selected.topic?.name ||
    "—";


  DOM.previewSubtopic.textContent =
    selected.subtopic?.name ||
    "—";


  /*
   * Curriculum selection controls
   * the sidebar preview.
   */

  updateSidebarPreview();


  updatePublishState();

}


/* ============================================================
   SIDEBAR PREVIEW
   ============================================================ */

/*
   IMPORTANT ARCHITECTURAL RULE
   ------------------------------------------------------------
   The sidebar is NOT extracted from arbitrary content
   blocks.

   It is composed from:

      1. Selected curriculum hierarchy
      2. Navigation structure

   Therefore:

      Domain
        ↓
      Subject
        ↓
      Topic
        ↓
      Subtopic
        ↓
      Navigation Sections
*/


function updateSidebarPreview() {

  if (
    !state.curriculum
  ) {

    renderEmptySidebar();

    return;

  }


  if (
    !state.selected.domain
  ) {

    renderEmptySidebar();

    return;

  }


  const nodes =
    buildSidebarNodes();


  renderSidebarNodes(
    nodes
  );

}


/* ============================================================
   BUILD SIDEBAR NODES
   ============================================================ */

function buildSidebarNodes() {

  const selected =
    state.selected;


  const nodes =
    [];


  /*
   * DOMAIN
   */

  const domainNode = {

    id:
      selected.domain.id,

    title:
      selected.domain.name,

    type:
      "domain",

    active:
      false,

    children:
      []

  };


  nodes.push(
    domainNode
  );


  /*
   * SUBJECT
   */

  if (
    selected.subject
  ) {

    const subjectNode = {

      id:
        selected.subject.id,

      title:
        selected.subject.name,

      type:
        "subject",

      active:
        false,

      children:
        []

    };


    domainNode.children.push(
      subjectNode
    );


    /*
     * TOPIC
     */

    if (
      selected.topic
    ) {

      const topicNode = {

        id:
          selected.topic.id,

        title:
          selected.topic.name,

        type:
          "topic",

        active:
          false,

        children:
          []

      };


      subjectNode.children.push(
        topicNode
      );


      /*
       * SUBTOPIC
       */

      if (
        selected.subtopic
      ) {

        const subtopicNode = {

          id:
            selected.subtopic.id,

          title:
            selected.subtopic.name,

          type:
            "subtopic",

          active:
            true,

          children:
            []

        };


        topicNode.children.push(
          subtopicNode
        );


        /*
         * NAVIGATION SECTIONS
         *
         * These are the actual tutorial
         * navigation items.
         */

        const navigationNodes =
          getNavigationNodesForSelection();


        navigationNodes.forEach(
          node => {

            subtopicNode.children.push(
              node
            );

          }
        );

      }

    }

  }


  return nodes;

}


/* ============================================================
   GET NAVIGATION FOR CURRENT SELECTION
   ============================================================ */

function getNavigationNodesForSelection() {

  if (
    !state.navigation
  ) {

    return [];

  }


  const navigation =
    state.navigation;


  /*
   * Current navigation.json format:
   *
   * {
   *   title: "Python Lists",
   *   sections: [...]
   * }
   */


  const sections =

    Array.isArray(
      navigation.sections
    )
      ? navigation.sections
      : [];


  if (
    !sections.length
  ) {

    return [];

  }


  /*
   * If navigation has a route,
   * verify it against current selection.
   *
   * This keeps navigation future-proof.
   */

  if (
    navigation.route
  ) {

    if (
      !navigationMatchesSelection(
        navigation.route
      )
    ) {

      return [];

    }

  }


  return normalizeNavigationSections(
    sections
  );

}


/* ============================================================
   NAVIGATION ROUTE MATCH
   ============================================================ */

function navigationMatchesSelection(
  route
) {

  const selected =
    state.selected;


  if (
    !selected.domain ||
    !selected.subject ||
    !selected.topic ||
    !selected.subtopic
  ) {

    return false;

  }


  return (

    matchesRouteValue(
      route.domain,
      selected.domain
    ) &&

    matchesRouteValue(
      route.subject,
      selected.subject
    ) &&

    matchesRouteValue(
      route.topic,
      selected.topic
    ) &&

    matchesRouteValue(
      route.subtopic,
      selected.subtopic
    )

  );

}


/* ============================================================
   ROUTE VALUE MATCH
   ============================================================ */

function matchesRouteValue(
  routeValue,
  curriculumItem
) {

  if (
    !routeValue
  ) {

    return true;

  }


  const normalizedRoute =
    String(
      routeValue
    )
      .trim()
      .toLowerCase();


  const values = [

    curriculumItem.id,

    curriculumItem.slug,

    curriculumItem.name

  ]
    .filter(
      Boolean
    )
    .map(
      value =>
        String(
          value
        )
          .trim()
          .toLowerCase()
    );


  return values.includes(
    normalizedRoute
  );

}


/* ============================================================
   NORMALIZE NAVIGATION SECTIONS
   ============================================================ */

function normalizeNavigationSections(
  sections
) {

  return sections.map(
    (
      section,
      index
    ) => {

      if (
        typeof section ===
        "string"
      ) {

        return {

          id:
            `navigation-${index + 1}`,

          title:
            section,

          type:
            "lesson",

          active:
            index === 0,

          children:
            []

        };

      }


      const children =

        section.children ||

        section.sections ||

        section.items ||

        [];


      return {

        id:
          section.id ||
          `navigation-${index + 1}`,

        title:

          section.title ||

          section.name ||

          section.label ||

          `Section ${index + 1}`,

        type:
          section.type ||
          "lesson",

        active:
          Boolean(
            section.active
          ),

        children:
          normalizeNavigationSections(
            children
          )

      };

    }
  );

}


/* ============================================================
   RENDER SIDEBAR NODES
   ============================================================ */

function renderSidebarNodes(
  nodes
) {

  DOM.sidebar.innerHTML =
    "";


  if (
    !nodes.length
  ) {

    renderEmptySidebar();

    return;

  }


  const root =
    document.createElement(
      "div"
    );


  root.className =
    "sidebar-root";


  nodes.forEach(
    (
      node,
      index
    ) => {

      root.appendChild(
        createSidebarNode(
          node,
          0,
          index ===
            nodes.length - 1
        )
      );

    }
  );


  DOM.sidebar.appendChild(
    root
  );


  updateSidebarNodeCount();

}


/* ============================================================
   CREATE SIDEBAR NODE
   ============================================================ */

function createSidebarNode(
  node,
  level,
  isLast
) {

  const wrapper =
    document.createElement(
      "div"
    );


  wrapper.className =
    "sidebar-node";


  const row =
    document.createElement(
      "div"
    );


  row.className =
    "sidebar-node-row";


  if (
    node.active
  ) {

    row.classList.add(
      "active"
    );

  }


  const icon =
    document.createElement(
      "span"
    );


  icon.className =
    "sidebar-node-icon";


  icon.innerHTML =
    getSidebarIcon(
      node,
      level
    );


  const title =
    document.createElement(
      "span"
    );


  title.className =
    "sidebar-node-title";


  title.textContent =
    node.title;


  row.appendChild(
    icon
  );


  row.appendChild(
    title
  );


  wrapper.appendChild(
    row
  );


  if (
    node.children &&
    node.children.length
  ) {

    const children =
      document.createElement(
        "div"
      );


    children.className =
      "sidebar-children";


    node.children.forEach(
      (
        child,
        index
      ) => {

        children.appendChild(
          createSidebarNode(
            child,
            level + 1,
            index ===
              node.children.length - 1
          )
        );

      }
    );


    wrapper.appendChild(
      children
    );

  }


  return wrapper;

}


/* ============================================================
   SIDEBAR ICONS
   ============================================================ */

function getSidebarIcon(
  node,
  level
) {

  switch (
    node.type
  ) {

    case "domain":

      return (
        '<i class="fa-solid fa-layer-group"></i>'
      );


    case "subject":

      return (
        '<i class="fa-solid fa-book"></i>'
      );


    case "topic":

      return (
        '<i class="fa-solid fa-folder-open"></i>'
      );


    case "subtopic":

      return (
        '<i class="fa-solid fa-book-open"></i>'
      );


    case "chapter":

      return (
        '<i class="fa-solid fa-book"></i>'
      );


    case "lesson":

      return (
        '<i class="fa-regular fa-file-lines"></i>'
      );


    case "code":

      return (
        '<i class="fa-solid fa-code"></i>'
      );


    default:

      if (
        level === 0
      ) {

        return (
          '<i class="fa-solid fa-layer-group"></i>'
        );

      }


      return (
        '<i class="fa-solid fa-angle-right"></i>'
      );

  }

}


/* ============================================================
   SIDEBAR NODE COUNT
   ============================================================ */

function updateSidebarNodeCount() {

  const count =
    DOM.sidebar.querySelectorAll(
      ".sidebar-node-row"
    ).length;


  DOM.sidebarNodeCount.textContent =
    count;

}


/* ============================================================
   FILE UPLOAD
   ============================================================ */

async function handleFileUpload(
  event
) {

  const file =
    event.target.files?.[0];


  if (
    !file
  ) {

    return;

  }


  const extension =
    file.name
      .split(".")
      .pop()
      .toLowerCase();


  if (
    ![
      "json",
      "md",
      "markdown"
    ].includes(
      extension
    )
  ) {

    showValidationError(
      "Only JSON and Markdown files are supported."
    );


    return;

  }


  try {

    const content =
      await file.text();


    DOM.editor.value =
      content;


    DOM.fileName.textContent =
      file.name;


    state.content.raw =
      content;


    state.content.format =
      extension ===
      "json"
        ? "JSON"
        : "Markdown";


    DOM.contentFormat.textContent =
      state.content.format;


    parseAndRenderContent();

  }

  catch (
    error
  ) {

    showValidationError(
      error.message
    );

  }

}


/* ============================================================
   EDITOR INPUT
   ============================================================ */

function handleEditorInput() {

  state.content.raw =
    DOM.editor.value;


  state.content.format =
    detectContentFormat(
      DOM.editor.value
    );


  DOM.fileName.textContent =
    "Pasted content";


  DOM.contentFormat.textContent =
    state.content.format;


  parseAndRenderContent();

}


/* ============================================================
   DETECT CONTENT FORMAT
   ============================================================ */

function detectContentFormat(
  content
) {

  const value =
    content.trim();


  if (
    value.startsWith(
      "{"
    ) ||
    value.startsWith(
      "["
    )
  ) {

    return "JSON";

  }


  return "Markdown";

}


/* ============================================================
   PARSE CONTENT
   ============================================================ */

function parseAndRenderContent() {

  const raw =
    state.content.raw.trim();


  if (
    !raw
  ) {

    state.content.parsed =
      null;

    state.content.valid =
      false;


    renderEmptyContentPreview();


    showValidationNeutral(
      "Waiting for content"
    );


    updateSidebarPreview();

    updatePublishState();

    return;

  }


  try {

    if (
      state.content.format ===
      "JSON"
    ) {

      state.content.parsed =
        JSON.parse(
          raw
        );

    }

    else {

      state.content.parsed =
        parseMarkdown(
          raw
        );

    }


    state.content.valid =
      true;


    showValidationSuccess(
      "Content loaded successfully."
    );


    /*
     * IMPORTANT:
     *
     * Uploaded content is ONLY rendered
     * by the content renderer.
     *
     * It does NOT replace the sidebar.
     */

    renderContentPreview(
      state.content.parsed
    );


  }

  catch (
    error
  ) {

    console.error(
      "[Tutorial Composer] Content parsing failed:",
      error
    );


    state.content.parsed =
      null;

    state.content.valid =
      false;


    renderEmptyContentPreview();


    showValidationError(
      `Unable to parse content: ${error.message}`
    );

  }


  updatePublishState();

}


/* ============================================================
   MARKDOWN PARSER
   ============================================================ */

function parseMarkdown(
  raw
) {

  const lines =
    raw.split(
      /\r?\n/
    );


  const documentData = {

    title:
      "",

    sections:
      []

  };


  let current =
    null;


  lines.forEach(
    line => {

      const trimmed =
        line.trim();


      if (
        !trimmed
      ) {

        return;

      }


      if (
        trimmed.startsWith(
          "# "
        )
      ) {

        documentData.title =
          trimmed
            .substring(2)
            .trim();


        return;

      }


      if (
        trimmed.startsWith(
          "## "
        )
      ) {

        current = {

          title:
            trimmed
              .substring(3)
              .trim(),

          content:
            []

        };


        documentData.sections.push(
          current
        );


        return;

      }


      if (
        !current
      ) {

        current = {

          title:
            "Introduction",

          content:
            []

        };


        documentData.sections.push(
          current
        );

      }


      current.content.push(
        trimmed
      );

    }
  );


  return documentData;

}


/* ============================================================
   CONTENT PREVIEW
   ============================================================ */

function renderContentPreview(
  content
) {

  DOM.preview.innerHTML =
    "";


  const title =

    content.title ||

    content.name ||

    state.selected.subtopic?.name ||

    "Tutorial Content";


  DOM.previewTitle.textContent =
    title;


  const titleElement =
    document.createElement(
      "h2"
    );


  titleElement.className =
    "preview-title";


  titleElement.textContent =
    title;


  DOM.preview.appendChild(
    titleElement
  );


  const sections =
    extractPreviewSections(
      content
    );


  sections.forEach(
    section => {

      const element =
        document.createElement(
          "section"
        );


      element.className =
        "preview-section";


      const heading =
        document.createElement(
          "h4"
        );


      heading.textContent =
        section.title;


      element.appendChild(
        heading
      );


      if (
        section.description
      ) {

        const paragraph =
          document.createElement(
            "p"
          );


        paragraph.textContent =
          section.description;


        element.appendChild(
          paragraph
        );

      }


      if (
        section.code
      ) {

        const code =
          document.createElement(
            "code"
          );


        code.className =
          "preview-code";


        code.textContent =
          section.code;


        element.appendChild(
          code
        );

      }


      DOM.preview.appendChild(
        element
      );

    }
  );

}


/* ============================================================
   EXTRACT CONTENT PREVIEW SECTIONS
   ============================================================ */

function extractPreviewSections(
  content
) {

  const result =
    [];


  /*
   * Markdown / section-based content.
   */

  if (
    Array.isArray(
      content.sections
    )
  ) {

    content.sections.forEach(
      section => {

        result.push({

          title:
            section.title ||
            section.name ||
            "Section",

          description:
            extractText(
              section.content ||
              section.description ||
              ""
            ),

          code:
            section.code ||
            ""

        });

      }
    );

  }


  /*
   * Standard tutorial content
   * structures.
   */

  const standardBlocks = [

    "definition",

    "introduction",

    "explanation",

    "notes",

    "layman",

    "real_life",

    "technical",

    "example",

    "code",

    "summary",

    "key_takeaway",

    "ai_tutor"

  ];


  standardBlocks.forEach(
    key => {

      if (
        content[key] ===
        undefined
      ) {

        return;

      }


      result.push({

        title:
          prettifyKey(
            key
          ),

        description:
          extractText(
            content[key]
          ),

        code:
          key ===
          "code"
            ? extractText(
                content[key]
              )
            : ""

      });

    }
  );


  /*
   * Notes markdown.
   */

  if (
    content.notes?.markdown
  ) {

    result.push({

      title:
        "Notes",

      description:
        content.notes.markdown,

      code:
        ""

    });

  }


  if (
    !result.length
  ) {

    result.push({

      title:
        "Content",

      description:
        extractText(
          content
        ),

      code:
        ""

    });

  }


  return result;

}


/* ============================================================
   EXTRACT TEXT
   ============================================================ */

function extractText(
  value
) {

  if (
    typeof value ===
    "string"
  ) {

    return value;

  }


  if (
    Array.isArray(
      value
    )
  ) {

    return value
      .map(
        extractText
      )
      .filter(
        Boolean
      )
      .join(
        " "
      );

  }


  if (
    value &&
    typeof value ===
    "object"
  ) {

    return Object.entries(
      value
    )
      .map(
        (
          [
            key,
            item
          ]
        ) =>
          `${prettifyKey(key)}: ${extractText(item)}`
      )
      .join(
        " "
      );

  }


  return "";

}


/* ============================================================
   PRETTIFY KEY
   ============================================================ */

function prettifyKey(
  key
) {

  return String(
    key
  )
    .replace(
      /[_-]+/g,
      " "
    )
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );

}


/* ============================================================
   EMPTY SIDEBAR
   ============================================================ */

function renderEmptySidebar() {

  DOM.sidebar.innerHTML = `

    <div class="sidebar-empty">

      <i class="fa-regular fa-folder-open"></i>

      <strong>
        No curriculum selected
      </strong>

      <span>
        Select Domain → Subject → Topic → Subtopic
        to preview tutorial navigation.
      </span>

    </div>

  `;


  DOM.sidebarNodeCount.textContent =
    "0";

}


/* ============================================================
   EMPTY CONTENT PREVIEW
   ============================================================ */

function renderEmptyContentPreview() {

  DOM.previewTitle.textContent =
    "No content loaded";


  DOM.preview.innerHTML = `

    <div class="preview-empty">

      <i class="fa-regular fa-file-lines"></i>

      <strong>
        Content preview
      </strong>

      <span>
        Load tutorial content to preview it here.
      </span>

    </div>

  `;

}


/* ============================================================
   VALIDATION
   ============================================================ */

function showValidationSuccess(
  message
) {

  DOM.validation.textContent =
    `✓ ${message}`;


  DOM.validation.className =
    "validation-message valid";

}


function showValidationError(
  message
) {

  DOM.validation.textContent =
    `✕ ${message}`;


  DOM.validation.className =
    "validation-message invalid";

}


function showValidationNeutral(
  message
) {

  DOM.validation.textContent =
    message;


  DOM.validation.className =
    "validation-message";

}


/* ============================================================
   STATUS
   ============================================================ */

function setStatus(
  message,
  type
) {

  DOM.status.textContent =
    message;


  DOM.status.className =
    `status-badge ${type}`;

}


/* ============================================================
   PUBLISH STATE
   ============================================================ */

function updatePublishState() {

  const hierarchyReady =

    Boolean(

      state.selected.domain &&

      state.selected.subject &&

      state.selected.topic &&

      state.selected.subtopic

    );


  const contentReady =
    state.content.valid;


  DOM.publishButton.disabled =
    !(
      hierarchyReady &&
      contentReady
    );


  if (
    hierarchyReady &&
    contentReady
  ) {

    DOM.publishMessage.textContent =
      "Curriculum location and tutorial content are ready.";

    return;

  }


  if (
    !hierarchyReady
  ) {

    DOM.publishMessage.textContent =
      "Select Domain → Subject → Topic → Subtopic.";

    return;

  }


  DOM.publishMessage.textContent =
    "Load valid tutorial content.";

}


/* ============================================================
   SAVE DRAFT
   ============================================================ */

function handleSave() {

  if (
    DOM.publishButton.disabled
  ) {

    return;

  }


  const documentData = {

    version:
      "1.0.0",

    createdAt:
      new Date().toISOString(),

    curriculum: {

      domain:
        serialize(
          state.selected.domain
        ),

      subject:
        serialize(
          state.selected.subject
        ),

      topic:
        serialize(
          state.selected.topic
        ),

      subtopic:
        serialize(
          state.selected.subtopic
        )

    },

    navigation:
      state.navigation,

    content:
      state.content.parsed

  };


  const blob =
    new Blob(
      [
        JSON.stringify(
          documentData,
          null,
          2
        )
      ],
      {
        type:
          "application/json"
      }
    );


  const url =
    URL.createObjectURL(
      blob
    );


  const anchor =
    document.createElement(
      "a"
    );


  anchor.href =
    url;


  anchor.download =

    `${
      state.selected.subtopic?.slug ||
      "tutorial"
    }-draft.json`;


  document.body.appendChild(
    anchor
  );


  anchor.click();


  anchor.remove();


  URL.revokeObjectURL(
    url
  );


  DOM.publishMessage.textContent =
    "Local tutorial draft generated successfully. API/DB persistence will be connected later.";

}


/* ============================================================
   SERIALIZE CURRICULUM ITEM
   ============================================================ */

function serialize(
  item
) {

  if (
    !item
  ) {

    return null;

  }


  return {

    id:
      item.id,

    name:
      item.name,

    slug:
      item.slug

  };

}


/* ============================================================
   DEBUG / DEVELOPMENT API
   ============================================================ */

window.SkillHubCoreTutorialComposer = {

  state,

  loadCurriculum,

  loadNavigation,

  buildSidebarNodes,

  updateSidebarPreview,

  renderSidebarNodes,

  renderContentPreview,

  parseAndRenderContent,

  extractPreviewSections

};