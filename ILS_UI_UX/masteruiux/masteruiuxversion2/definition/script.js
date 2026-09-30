/* ============================================================
   SUIA TUTORIAL ENGINE
   DEFINITION BLOCK
   D1 → D8 PRESENTATION CONTROLLER
   ============================================================ */


/* ============================================================
   1. DEFINITION CONTENT
   ============================================================ */

const definitionData = {

  component: "definition",

  topic: "Python Variables",

  versions: [

    /* ========================================================
       D1 — CLASSIC DEFINITION
       ======================================================== */

    {
      id: "D1",

      title: "Classic Definition",

      subtitle:
        "H1 → Definition heading → highlighted definition card → explanation paragraph",

      definition:
        "A variable is a name that refers to an object so that the program can access that object.",

      explanation:
        "In Python, assignment binds a name to an object. The name can later be rebound to another object."
    },


    /* ========================================================
       D2 — DEFINITION + KEY CHARACTERISTICS
       ======================================================== */

    {
      id: "D2",

      title: "Definition + Key Characteristics",

      subtitle:
        "Definition → explanation → 4–6 key characteristics",

      definition:
        "A Python variable is a name used to reference an object during program execution.",

      explanation:
        "Understanding these characteristics helps explain assignment, reassignment, identity, and object behavior.",

      characteristics: [

        [
          "Name",
          "A variable provides a readable name for a reference."
        ],

        [
          "Reference",
          "The name refers to an object rather than acting as a fixed storage box."
        ],

        [
          "Dynamic Binding",
          "A name can be rebound to another object."
        ],

        [
          "Object Identity",
          "The referenced object has its own identity."
        ],

        [
          "Scope",
          "The meaning and lifetime of a name depend on its scope."
        ]

      ]

    },


    /* ========================================================
       D3 — DEFINITION + REAL-WORLD ANALOGY
       ======================================================== */

    {
      id: "D3",

      title: "Definition + Real-World Analogy",

      subtitle:
        "Definition → technical explanation → real-world analogy card",

      definition:
        "A variable can be understood as a name associated with an object.",

      explanation:
        "The name provides a convenient way for code to refer to the object without repeatedly describing the object itself.",

      analogy:
        "Think of a labeled locker. The label helps you identify which locker you mean; changing the label's association does not mean the label itself becomes the locker."

    },


    /* ========================================================
       D4 — DEFINITION + WHY IT MATTERS
       ======================================================== */

    {
      id: "D4",

      title: "Definition + Why It Matters",

      subtitle:
        "Definition → explanation → Why is this important?",

      definition:
        "A variable gives a program a reusable name through which an object can be accessed.",

      explanation:
        "Variables make programs easier to read, reason about, and modify because values or objects can be referred to by meaningful names.",

      why:
        "Without meaningful names, programs would be much harder to express and maintain. Naming lets later statements refer to data without repeating the original construction."

    },


    /* ========================================================
       D5 — DEFINITION + VISUAL CONCEPT
       ======================================================== */

    {
      id: "D5",

      title: "Definition + Visual Concept",

      subtitle:
        "Definition → short explanation → infographic / visual model",

      definition:
        "A Python variable name refers to an object.",

      explanation:
        "The simplest mental model is a name connected to an object. The object has its own value and identity.",

      visual: true

    },


    /* ========================================================
       D6 — DEFINITION + TECHNICAL BREAKDOWN
       ======================================================== */

    {
      id: "D6",

      title: "Definition + Technical Breakdown",

      subtitle:
        "Definition → terminology → technical explanation → key points",

      definition:
        "In Python, assignment binds a name to an object within a namespace.",

      explanation:
        "This terminology gives a more precise model than treating a Python variable as a simple memory box.",

      terminology: [

        [
          "Name",
          "Identifier used by the program."
        ],

        [
          "Namespace",
          "Mapping in which names are associated with objects."
        ],

        [
          "Object",
          "Runtime entity with identity, type, and value."
        ],

        [
          "Binding",
          "Association between a name and an object."
        ]

      ]

    },


    /* ========================================================
       D7 — DEFINITION + EXAMPLE
       ======================================================== */

    {
      id: "D7",

      title: "Definition + Example",

      subtitle:
        "Definition → explanation → simple code/example → takeaway",

      definition:
        "A variable is a name that can refer to an object.",

      explanation:
        "The assignment statement below binds the name x to an integer object.",

      code:
        "x = 10",

      takeaway:
        "The important idea is the relationship between the name x and the object represented by 10."

    },


    /* ========================================================
       D8 — COMPLETE LEARNING CARD
       ======================================================== */

    {
      id: "D8",

      title: "Complete Learning Card",

      subtitle:
        "Definition → explanation → characteristics → visual → example → key takeaway",

      definition:
        "A Python variable is a name that refers to an object.",

      explanation:
        "This complete presentation combines the conceptual, technical, visual, and practical views into one learning card.",

      characteristics: [

        [
          "Name",
          "Provides a readable identifier."
        ],

        [
          "Reference",
          "Refers to an object."
        ],

        [
          "Dynamic Binding",
          "Can be rebound to another object."
        ],

        [
          "Identity",
          "The object has its own identity."
        ],

        [
          "Scope",
          "Name visibility depends on scope."
        ]

      ],

      visual: true,

      code:
        "x = 10\ny = x",

      takeaway:
        "Think in terms of names, objects, and bindings rather than treating a Python variable as a fixed box containing a value."

    }

  ]

};


/* ============================================================
   2. DOM REFERENCES
   ============================================================ */

const renderer =
  document.getElementById("definitionRenderer");

const versionTabs =
  document.getElementById("versionTabs");

const versionCounter =
  document.getElementById("versionCounter");

const previousButton =
  document.getElementById("previousButton");

const nextButton =
  document.getElementById("nextButton");

const progressDots =
  document.getElementById("progressDots");


/* ============================================================
   3. CURRENT VERSION
   ============================================================ */

let currentIndex = 0;


/* ============================================================
   4. HTML ESCAPING
   ------------------------------------------------------------
   Prevents content coming from JSON from being interpreted
   as executable HTML.
   ============================================================ */

function escapeHtml(value) {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}


/* ============================================================
   5. VISUAL CONCEPT RENDERER
   ============================================================ */

function renderVisualConcept() {

  return `

    <div
      class="visual-mini"
      aria-label="Variable references an object visual"
    >

      <div class="visual-main">

        Variable: x

      </div>


      <div class="visual-children">

        <span class="visual-child">
          references
        </span>

        <span class="visual-child">
          Object: 10
        </span>

        <span class="visual-child">
          identity
        </span>

      </div>

    </div>

  `;

}


/* ============================================================
   6. CHARACTERISTICS RENDERER
   ============================================================ */

function renderCharacteristics(items = []) {

  if (!items.length) {

    return "";

  }


  return `

    <h3 class="section-title">

      Key Characteristics

    </h3>


    <div class="characteristics">

      ${items
        .map(([title, description]) => {

          return `

            <article class="characteristic">

              <strong>

                ${escapeHtml(title)}

              </strong>


              <span>

                ${escapeHtml(description)}

              </span>

            </article>

          `;

        })
        .join("")}

    </div>

  `;

}


/* ============================================================
   7. REAL-WORLD ANALOGY RENDERER
   ============================================================ */

function renderAnalogy(analogy) {

  if (!analogy) {

    return "";

  }


  return `

    <div class="analogy">

      <div class="analogy-title">

        Real-World Analogy

      </div>


      <p>

        ${escapeHtml(analogy)}

      </p>

    </div>

  `;

}


/* ============================================================
   8. WHY IT MATTERS RENDERER
   ============================================================ */

function renderWhyItMatters(content) {

  if (!content) {

    return "";

  }


  return `

    <div class="why-card">

      <h3>

        Why is this important?

      </h3>


      <p>

        ${escapeHtml(content)}

      </p>

    </div>

  `;

}


/* ============================================================
   9. TECHNICAL TERMINOLOGY RENDERER
   ============================================================ */

function renderTerminology(items = []) {

  if (!items.length) {

    return "";

  }


  return `

    <h3 class="section-title">

      Technical Terminology

    </h3>


    <div class="terminology">

      ${items
        .map(([term, description]) => {

          return `

            <div class="term-row">

              <strong>

                ${escapeHtml(term)}

              </strong>


              <span>

                ${escapeHtml(description)}

              </span>

            </div>

          `;

        })
        .join("")}

    </div>

  `;

}


/* ============================================================
   10. CODE EXAMPLE RENDERER
   ============================================================ */

function renderCode(code) {

  if (!code) {

    return "";

  }


  return `

    <div class="example">

      <h3 class="section-title">

        Example

      </h3>


      <pre class="code-box"><code>${escapeHtml(code)}</code></pre>

    </div>

  `;

}


/* ============================================================
   11. TAKEAWAY RENDERER
   ============================================================ */

function renderTakeaway(content) {

  if (!content) {

    return "";

  }


  return `

    <div class="takeaway">

      <span class="takeaway-icon">

        ✓

      </span>


      <p>

        ${escapeHtml(content)}

      </p>

    </div>

  `;

}


/* ============================================================
   12. BUILD VERSION CONTENT
   ============================================================ */

function renderVersion(version) {

  const additionalSections = [];


  /* ----------------------------------------------------------
     Characteristics
     ---------------------------------------------------------- */

  if (version.characteristics) {

    additionalSections.push(

      renderCharacteristics(
        version.characteristics
      )

    );

  }


  /* ----------------------------------------------------------
     Real-world analogy
     ---------------------------------------------------------- */

  if (version.analogy) {

    additionalSections.push(

      renderAnalogy(
        version.analogy
      )

    );

  }


  /* ----------------------------------------------------------
     Why it matters
     ---------------------------------------------------------- */

  if (version.why) {

    additionalSections.push(

      renderWhyItMatters(
        version.why
      )

    );

  }


  /* ----------------------------------------------------------
     Visual
     ---------------------------------------------------------- */

  if (version.visual) {

    additionalSections.push(

      renderVisualConcept()

    );

  }


  /* ----------------------------------------------------------
     Technical terminology
     ---------------------------------------------------------- */

  if (version.terminology) {

    additionalSections.push(

      renderTerminology(
        version.terminology
      )

    );

  }


  /* ----------------------------------------------------------
     Code
     ---------------------------------------------------------- */

  if (version.code) {

    additionalSections.push(

      renderCode(
        version.code
      )

    );

  }


  /* ----------------------------------------------------------
     Takeaway
     ---------------------------------------------------------- */

  if (version.takeaway) {

    additionalSections.push(

      renderTakeaway(
        version.takeaway
      )

    );

  }


  /* ==========================================================
     FINAL CARD
     ========================================================== */

  return `

    <article class="definition-card">


      <!-- =====================================================
           CARD HEADER
           ===================================================== -->

      <header class="definition-header">

        <p class="version-kicker">

          ${escapeHtml(version.id)}

        </p>


        <h2>

          ${escapeHtml(version.title)}

        </h2>


        <p>

          ${escapeHtml(version.subtitle)}

        </p>

      </header>



      <!-- =====================================================
           CARD BODY
           ===================================================== -->

      <div class="definition-body">


        <!-- ---------------------------------------------------
             DEFINITION
             --------------------------------------------------- -->

        <div class="definition-highlight">

          <div class="label">

            Definition

          </div>


          <p>

            ${escapeHtml(version.definition)}

          </p>

        </div>



        <!-- ---------------------------------------------------
             EXPLANATION
             --------------------------------------------------- -->

        <h3 class="section-title">

          Explanation

        </h3>


        <p class="explanation">

          ${escapeHtml(version.explanation)}

        </p>



        <!-- ---------------------------------------------------
             OPTIONAL CONTENT
             --------------------------------------------------- -->

        ${additionalSections.join("")}

      </div>

    </article>

  `;

}


/* ============================================================
   13. BUILD D1–D8 TABS
   ============================================================ */

function buildVersionTabs() {

  versionTabs.innerHTML =

    definitionData.versions

      .map((version, index) => {

        const isActive =
          index === currentIndex;


        return `

          <button

            class="
              version-tab
              ${isActive ? "active" : ""}
            "

            type="button"

            data-version-index="${index}"

            aria-label="
              Show ${escapeHtml(version.id)}
              ${escapeHtml(version.title)}
            "

            aria-pressed="${isActive}"

          >

            ${escapeHtml(version.id)}

          </button>

        `;

      })

      .join("");


  attachVersionTabEvents();

}


/* ============================================================
   14. VERSION TAB EVENTS
   ============================================================ */

function attachVersionTabEvents() {

  const buttons =
    versionTabs.querySelectorAll(
      "[data-version-index]"
    );


  buttons.forEach(button => {

    button.addEventListener(
      "click",
      () => {

        currentIndex =
          Number(
            button.dataset.versionIndex
          );


        render();

      }
    );

  });

}


/* ============================================================
   15. BUILD PROGRESS DOTS
   ============================================================ */

function buildProgressDots() {

  progressDots.innerHTML =

    definitionData.versions

      .map((version, index) => {

        const isActive =
          index === currentIndex;


        return `

          <button

            type="button"

            class="
              progress-dot
              ${isActive ? "active" : ""}
            "

            data-progress-index="${index}"

            aria-label="
              Go to ${escapeHtml(version.id)}
            "

          ></button>

        `;

      })

      .join("");


  attachProgressEvents();

}


/* ============================================================
   16. PROGRESS EVENTS
   ============================================================ */

function attachProgressEvents() {

  const dots =
    progressDots.querySelectorAll(
      "[data-progress-index]"
    );


  dots.forEach(dot => {

    dot.addEventListener(
      "click",
      () => {

        currentIndex =
          Number(
            dot.dataset.progressIndex
          );


        render();

      }
    );

  });

}


/* ============================================================
   17. UPDATE NAVIGATION STATE
   ============================================================ */

function updateNavigation() {

  const firstVersion =
    currentIndex === 0;


  const lastVersion =
    currentIndex ===
    definitionData.versions.length - 1;


  previousButton.disabled =
    firstVersion;


  nextButton.disabled =
    lastVersion;


  const currentVersion =
    definitionData.versions[currentIndex];


  versionCounter.textContent =

    `${currentVersion.id} of D8`;

}


/* ============================================================
   18. MAIN RENDER FUNCTION
   ============================================================ */

function render() {

  const version =
    definitionData.versions[currentIndex];


  /* ----------------------------------------------------------
     Render selected version
     ---------------------------------------------------------- */

  renderer.innerHTML =
    renderVersion(version);


  /* ----------------------------------------------------------
     Update counter
     ---------------------------------------------------------- */

  versionCounter.textContent =

    `${version.id} of D8`;


  /* ----------------------------------------------------------
     Update navigation
     ---------------------------------------------------------- */

  updateNavigation();


  /* ----------------------------------------------------------
     Rebuild tabs
     ---------------------------------------------------------- */

  buildVersionTabs();


  /* ----------------------------------------------------------
     Rebuild progress dots
     ---------------------------------------------------------- */

  buildProgressDots();

}


/* ============================================================
   19. PREVIOUS BUTTON
   ============================================================ */

previousButton.addEventListener(
  "click",
  () => {

    if (currentIndex > 0) {

      currentIndex -= 1;

      render();

    }

  }
);


/* ============================================================
   20. NEXT BUTTON
   ============================================================ */

nextButton.addEventListener(
  "click",
  () => {

    if (
      currentIndex <
      definitionData.versions.length - 1
    ) {

      currentIndex += 1;

      render();

    }

  }
);


/* ============================================================
   21. KEYBOARD NAVIGATION
   ============================================================ */

document.addEventListener(
  "keydown",
  event => {

    /* --------------------------------------------------------
       Arrow Left
       -------------------------------------------------------- */

    if (
      event.key === "ArrowLeft" &&
      currentIndex > 0
    ) {

      currentIndex -= 1;

      render();

    }


    /* --------------------------------------------------------
       Arrow Right
       -------------------------------------------------------- */

    if (
      event.key === "ArrowRight" &&
      currentIndex <
      definitionData.versions.length - 1
    ) {

      currentIndex += 1;

      render();

    }

  }
);


/* ============================================================
   22. INITIAL RENDER
   ============================================================ */

render();