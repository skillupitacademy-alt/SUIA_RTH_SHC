/* ============================================================
   TUTORIAL ENGINE
   SIDEBAR.JS
   ============================================================ */


/* ============================================================
   1. CONFIGURATION
   ============================================================ */

const DATA_FILE = "./sidebar.json";


/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const brandLogo =
  document.getElementById("brandLogo");

const brandName =
  document.getElementById("brandName");

const brandTagline =
  document.getElementById("brandTagline");

const subjectIcon =
  document.getElementById("subjectIcon");

const subjectTitle =
  document.getElementById("subjectTitle");

const progressPercentage =
  document.getElementById("progressPercentage");

const progressBar =
  document.getElementById("progressBar");

const progressBarFill =
  document.getElementById("progressBarFill");

const navigationTree =
  document.getElementById("navigationTree");


/* ============================================================
   3. CURRENT URL
   ============================================================ */

const currentPath =
  normalizePath(window.location.pathname);


/* ============================================================
   4. INITIALIZATION
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  initializeSidebar
);


async function initializeSidebar() {

  try {

    console.log(
      "[Tutorial Engine] Initializing sidebar..."
    );


    const tutorialData =
      await loadTutorialData();


    console.log(
      "[Tutorial Engine] JSON loaded successfully."
    );


    applyBrand(
      tutorialData.brand
    );


    applyTheme(
      tutorialData.brand
    );


    applySubject(
      tutorialData.curriculum
    );


    applyProgress(
      tutorialData.progress
    );


    renderCurriculum(
      tutorialData.curriculum
    );


    console.log(
      "[Tutorial Engine] Sidebar initialized successfully."
    );


  } catch (error) {

    console.error(
      "[Tutorial Engine] Initialization failed:",
      error
    );


    showNavigationError(
      "Unable to load tutorial navigation."
    );

  }

}


/* ============================================================
   5. LOAD JSON
   ============================================================ */

async function loadTutorialData() {

  const response =
    await fetch(
      DATA_FILE,
      {
        cache: "no-store"
      }
    );


  if (!response.ok) {

    throw new Error(
      `Unable to load ${DATA_FILE}. HTTP ${response.status}`
    );

  }


  return await response.json();

}


/* ============================================================
   6. BRAND
   ============================================================ */

function applyBrand(brand) {

  if (!brand) {

    return;

  }


  brandName.textContent =
    brand.name || "";


  brandTagline.textContent =
    brand.tagline || "";


  brandLogo.innerHTML =
    "";


  /*
     If a real logo exists,
     display it.
  */

  if (
    brand.logo &&
    typeof brand.logo === "string" &&
    brand.logo.trim() !== ""
  ) {

    const image =
      document.createElement("img");


    image.src =
      brand.logo;


    image.alt =
      `${brand.name || "Brand"} logo`;


    image.onerror =
      function () {

        brandLogo.innerHTML =
          "";


        brandLogo.textContent =
          brand.shortName || "RTH";

      };


    brandLogo.appendChild(
      image
    );


  } else {

    /*
       Fallback when logo is empty.
    */

    brandLogo.textContent =
      brand.shortName || "RTH";

  }

}


/* ============================================================
   7. APPLY THEME
   ============================================================ */

function applyTheme(brand) {

  if (
    !brand ||
    !brand.theme
  ) {

    return;

  }


  const root =
    document.documentElement;


  if (brand.theme.primary) {

    root.style.setProperty(
      "--primary",
      brand.theme.primary
    );

  }


  if (brand.theme.primaryDark) {

    root.style.setProperty(
      "--primary-dark",
      brand.theme.primaryDark
    );

  }


  if (brand.theme.secondary) {

    root.style.setProperty(
      "--secondary",
      brand.theme.secondary
    );

  }


  if (brand.theme.accentBackground) {

    root.style.setProperty(
      "--accent-background",
      brand.theme.accentBackground
    );

  }

}


/* ============================================================
   8. SUBJECT
   ============================================================ */

function applySubject(curriculum) {

  if (
    !curriculum ||
    !curriculum.subject
  ) {

    return;

  }


  const subject =
    curriculum.subject;


  /*
     IMPORTANT

     The header shows:

         Frontend Development

     JavaScript is NOT inserted here.

     JavaScript comes from curriculum.topics.
  */

  subjectTitle.textContent =
    subject.name || "";


  /*
     Use icon from JSON when available.
  */

  if (
    subject.icon &&
    typeof subject.icon === "string"
  ) {

    subjectIcon.innerHTML =
      `<i class="${escapeHTML(subject.icon)}"></i>`;

  } else {

    subjectIcon.innerHTML =
      '<i class="fa-solid fa-code"></i>';

  }

}


/* ============================================================
   9. PROGRESS
   ============================================================ */

function applyProgress(progress) {

  const percentage =
    Number(
      progress?.percentage || 0
    );


  const safePercentage =
    Math.max(
      0,
      Math.min(
        100,
        percentage
      )
    );


  progressPercentage.textContent =
    `${safePercentage}%`;


  progressBarFill.style.width =
    `${safePercentage}%`;


  progressBar.setAttribute(
    "aria-valuenow",
    String(safePercentage)
  );

}


/* ============================================================
   10. RENDER CURRICULUM
   ============================================================ */

function renderCurriculum(curriculum) {

  navigationTree.innerHTML =
    "";


  if (
    !curriculum ||
    !Array.isArray(
      curriculum.topics
    )
  ) {

    showNavigationError(
      "No tutorial topics found."
    );

    return;

  }


  /*
     IMPORTANT

     The JSON structure is:

       topics
         └── JavaScript
               ├── JavaScript Fundamentals
               ├── Variables
               ├── Functions
               ├── ECMAScript
               ├── DOM
               ├── Events
               └── Asynchronous JavaScript

     We render curriculum.topics directly.

     Therefore there is NO duplicate JavaScript.
  */

  const tree =
    createTreeLevel(
      curriculum.topics,
      0
    );


  navigationTree.appendChild(
    tree
  );


  /*
     Open branches containing
     the current URL.
  */

  expandActiveBranches();

}


/* ============================================================
   11. CREATE TREE LEVEL
   ============================================================ */

function createTreeLevel(
  nodes,
  level
) {

  const container =
    document.createElement("div");


  container.className =
    "tree-level";


  if (
    !Array.isArray(nodes)
  ) {

    return container;

  }


  nodes.forEach(
    node => {

      if (
        !node ||
        typeof node !== "object"
      ) {

        return;

      }


      const treeNode =
        createTreeNode(
          node,
          level
        );


      container.appendChild(
        treeNode
      );

    }
  );


  return container;

}


/* ============================================================
   12. CREATE TREE NODE
   ============================================================ */

function createTreeNode(
  node,
  level
) {

  const treeNode =
    document.createElement("div");


  treeNode.className =
    "tree-node";


  treeNode.dataset.level =
    String(level);


  treeNode.dataset.id =
    node.id || "";


  const children =
    getNodeChildren(node);


  const hasChildren =
    children.length > 0;


  /*
     ----------------------------------------------------------
     ROW
     ----------------------------------------------------------
  */

  const row =
    document.createElement("div");


  row.className =
    "tree-node-row";


  /*
     ----------------------------------------------------------
     ACTIVE STATE
     ----------------------------------------------------------
  */

  const nodePath =
    normalizePath(
      node.url || ""
    );


  if (
    nodePath &&
    nodePath === currentPath
  ) {

    row.classList.add(
      "is-active"
    );

  }


  /*
     ----------------------------------------------------------
     EXPAND BUTTON
     ----------------------------------------------------------
  */

  if (hasChildren) {

    const expandButton =
      document.createElement("button");


    expandButton.type =
      "button";


    expandButton.className =
      "node-expand";


    expandButton.setAttribute(
      "aria-expanded",
      node.expanded === true
        ? "true"
        : "false"
    );


    expandButton.setAttribute(
      "aria-label",
      node.expanded === true
        ? `Collapse ${node.name}`
        : `Expand ${node.name}`
    );


    expandButton.innerHTML =
      '<i class="fa-solid fa-chevron-right"></i>';


    expandButton.addEventListener(
      "click",
      function (event) {

        event.stopPropagation();


        toggleNode(
          treeNode,
          expandButton
        );

      }
    );


    row.appendChild(
      expandButton
    );


  } else {

    const placeholder =
      document.createElement("span");


    placeholder.className =
      "node-expand-placeholder";


    row.appendChild(
      placeholder
    );

  }


  /*
     ----------------------------------------------------------
     ICON
     ----------------------------------------------------------
  */

  const icon =
    document.createElement("span");


  icon.className =
    "node-icon";


  icon.innerHTML =
    getNodeIcon(
      node,
      level
    );


  row.appendChild(
    icon
  );


  /*
     ----------------------------------------------------------
     LABEL
     ----------------------------------------------------------
  */

  const label =
    document.createElement("span");


  label.className =
    "node-label";


  label.textContent =
    node.name || "Untitled";


  row.appendChild(
    label
  );


  /*
     ----------------------------------------------------------
     STATUS
     ----------------------------------------------------------
  */

  const status =
    document.createElement("span");


  status.className =
    "node-status";


  status.innerHTML =
    getStatusHTML(
      node.status
    );


  row.appendChild(
    status
  );


  /*
     ----------------------------------------------------------
     ROW CLICK
     ----------------------------------------------------------
  */

  row.addEventListener(
    "click",
    function () {

      handleNodeClick(
        node,
        treeNode
      );

    }
  );


  treeNode.appendChild(
    row
  );


  /*
     ----------------------------------------------------------
     CHILDREN
     ----------------------------------------------------------
  */

  if (hasChildren) {

    const childrenContainer =
      document.createElement("div");


    childrenContainer.className =
      "tree-children";


    const isExpanded =
      node.expanded === true;


    childrenContainer.hidden =
      !isExpanded;


    if (isExpanded) {

      treeNode.classList.add(
        "is-expanded"
      );

    }


    const childTree =
      createTreeLevel(
        children,
        level + 1
      );


    childrenContainer.appendChild(
      childTree
    );


    treeNode.appendChild(
      childrenContainer
    );

  }


  return treeNode;

}


/* ============================================================
   13. GET CHILDREN
   ============================================================ */

function getNodeChildren(node) {

  /*
     Primary structure.
  */

  if (
    Array.isArray(
      node.children
    )
  ) {

    return node.children;

  }


  /*
     Backward compatibility.
  */

  if (
    Array.isArray(
      node.subtopics
    )
  ) {

    return node.subtopics;

  }


  if (
    Array.isArray(
      node.topics
    )
  ) {

    return node.topics;

  }


  return [];

}


/* ============================================================
   14. GET NODE ICON
   ============================================================ */

function getNodeIcon(
  node,
  level
) {

  /*
     JSON-defined icon always wins.
  */

  if (
    node.icon &&
    typeof node.icon === "string"
  ) {

    return `
      <i class="${escapeHTML(node.icon)}"></i>
    `;

  }


  /*
     Default hierarchy icons.
  */

  if (level === 0) {

    return `
      <i class="fa-brands fa-js"></i>
    `;

  }


  if (level === 1) {

    return `
      <i class="fa-regular fa-folder"></i>
    `;

  }


  if (level === 2) {

    return `
      <i class="fa-regular fa-folder-open"></i>
    `;

  }


  return `
    <i class="fa-regular fa-file"></i>
  `;

}


/* ============================================================
   15. STATUS
   ============================================================ */

function getStatusHTML(status) {

  switch (status) {

    case "completed":

      return `
        <span
          class="status-completed"
          title="Completed"
          aria-label="Completed"
        >
          <i class="fa-solid fa-check"></i>
        </span>
      `;


    case "in-progress":

      return `
        <span
          class="status-in-progress"
          title="In progress"
          aria-label="In progress"
        ></span>
      `;


    case "not-started":

    default:

      return `
        <span
          class="status-circle"
          title="Not started"
          aria-label="Not started"
        ></span>
      `;

  }

}


/* ============================================================
   16. TOGGLE NODE
   ============================================================ */

function toggleNode(
  treeNode,
  expandButton
) {

  const childrenContainer =
    treeNode.querySelector(
      ":scope > .tree-children"
    );


  if (!childrenContainer) {

    return;

  }


  const wasHidden =
    childrenContainer.hidden;


  childrenContainer.hidden =
    !wasHidden;


  treeNode.classList.toggle(
    "is-expanded",
    wasHidden
  );


  expandButton.setAttribute(
    "aria-expanded",
    wasHidden
      ? "true"
      : "false"
  );


  expandButton.setAttribute(
    "aria-label",
    wasHidden
      ? `Collapse ${getNodeName(treeNode)}`
      : `Expand ${getNodeName(treeNode)}`
  );

}


/* ============================================================
   17. NODE CLICK
   ============================================================ */

function handleNodeClick(
  node,
  treeNode
) {

  /*
     A node with a URL is a lesson.
  */

  if (
    node.url &&
    typeof node.url === "string"
  ) {

    navigateToLesson(
      node.url
    );

    return;

  }


  /*
     Parent without URL:
     toggle it.
  */

  const children =
    getNodeChildren(node);


  if (
    children.length > 0
  ) {

    const expandButton =
      treeNode.querySelector(
        ":scope > .tree-node-row > .node-expand"
      );


    if (expandButton) {

      toggleNode(
        treeNode,
        expandButton
      );

    }

  }

}


/* ============================================================
   18. NAVIGATION
   ============================================================ */

function navigateToLesson(url) {

  const cleanPath =
    normalizePath(url);


  if (!cleanPath) {

    console.warn(
      "[Tutorial Engine] Invalid URL:",
      url
    );

    return;

  }


  console.log(
    "[Tutorial Engine] Navigating to:",
    url
  );


  /*
     IMPORTANT

     This is only a frontend sidebar.

     The destination page must actually exist
     for this URL to work.
  */

  window.location.href =
    url;

}


/* ============================================================
   19. EXPAND ACTIVE BRANCHES
   ============================================================ */

function expandActiveBranches() {

  const activeRows =
    navigationTree.querySelectorAll(
      ".tree-node-row.is-active"
    );


  activeRows.forEach(
    activeRow => {

      const treeNode =
        activeRow.parentElement;


      openParentBranches(
        treeNode
      );

    }
  );

}


/* ============================================================
   20. OPEN PARENT BRANCHES
   ============================================================ */

function openParentBranches(
  treeNode
) {

  let parent =
    treeNode.parentElement;


  while (
    parent &&
    parent !== navigationTree
  ) {

    if (
      parent.classList.contains(
        "tree-children"
      )
    ) {

      parent.hidden =
        false;


      const parentNode =
        parent.parentElement;


      if (
        parentNode &&
        parentNode.classList.contains(
          "tree-node"
        )
      ) {

        parentNode.classList.add(
          "is-expanded"
        );


        const expandButton =
          parentNode.querySelector(
            ":scope > .tree-node-row > .node-expand"
          );


        if (expandButton) {

          expandButton.setAttribute(
            "aria-expanded",
            "true"
          );

        }

      }

    }


    parent =
      parent.parentElement;

  }

}


/* ============================================================
   21. NAVIGATION ERROR
   ============================================================ */

function showNavigationError(
  message
) {

  if (!navigationTree) {

    return;

  }


  navigationTree.innerHTML =
    "";


  const error =
    document.createElement("div");


  error.className =
    "navigation-error";


  error.textContent =
    message;


  navigationTree.appendChild(
    error
  );

}


/* ============================================================
   22. NORMALIZE PATH
   ============================================================ */

function normalizePath(path) {

  if (
    !path ||
    typeof path !== "string"
  ) {

    return "";

  }


  try {

    const parsed =
      new URL(
        path,
        window.location.origin
      );


    let pathname =
      parsed.pathname;


    /*
       Remove trailing slash.
    */

    pathname =
      pathname.replace(
        /\/+$/,
        ""
      );


    if (
      pathname === ""
    ) {

      return "/";

    }


    return pathname;

  } catch (error) {

    return path
      .trim()
      .replace(
        /\/+$/,
        ""
      );

  }

}


/* ============================================================
   23. GET NODE NAME
   ============================================================ */

function getNodeName(
  treeNode
) {

  const label =
    treeNode.querySelector(
      ":scope > .tree-node-row > .node-label"
    );


  return label
    ? label.textContent
    : "topic";

}


/* ============================================================
   24. ESCAPE HTML
   ============================================================ */

function escapeHTML(
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
   25. FINAL DEBUG MESSAGE
   ============================================================ */

console.log(
  "[Tutorial Engine] sidebar.js loaded."
);