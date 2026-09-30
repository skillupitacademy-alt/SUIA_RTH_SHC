/* ============================================================
   SUIA TUTORIAL ENGINE
   PORTRAIT DEFINITION PAGE
   ============================================================ */


/* ============================================================
   LOAD TUTORIAL CONTENT
   ============================================================ */

async function loadTutorialContent() {

  try {

    const response = await fetch(
      "./definition.json",
      {
        cache: "no-store"
      }
    );


    if (!response.ok) {

      throw new Error(
        `Unable to load tutorial-data.json. HTTP ${response.status}`
      );

    }


    const data = await response.json();


    renderTutorialPage(data);


  } catch (error) {

    console.error(
      "Tutorial content loading failed:",
      error
    );

  }

}


/* ============================================================
   RENDER COMPLETE TUTORIAL PAGE
   ============================================================ */

function renderTutorialPage(data) {


  /* ==========================================================
     BRAND THEME
     ========================================================== */

  applyBrandTheme(
    data.brand.theme
  );


  /* ==========================================================
     PAGE TITLE
     ========================================================== */

  document.title =
    `${data.page.title} | ${data.brand.name}`;


  /* ==========================================================
     HEADER
     ========================================================== */

  setText(
    "category",
    data.page.category
  );


  setText(
    "title",
    data.page.title
  );


  setText(
    "intro",
    data.page.intro
  );


  /* ==========================================================
     DEFINITION
     ========================================================== */

  setText(
    "definition",
    data.page.definition
  );


  /* ==========================================================
     EXPLANATION
     ========================================================== */

  renderExplanation(
    data.page.explanation
  );


  /* ==========================================================
     EXAMPLE
     ========================================================== */

  renderExample(
    data.page.example
  );


  /* ==========================================================
     KEY CHARACTERISTICS
     ========================================================== */

  renderCharacteristics(
    data.page.characteristics
  );


  /* ==========================================================
     KEY TAKEAWAY
     ========================================================== */

  setText(
    "takeaway",
    data.page.takeaway
  );

}


/* ============================================================
   APPLY BRAND THEME
   ============================================================ */

function applyBrandTheme(theme) {


  const root =
    document.documentElement;


  root.style.setProperty(
    "--primary",
    theme.primary
  );


  root.style.setProperty(
    "--primary-dark",
    theme.primaryDark
  );


  root.style.setProperty(
    "--secondary",
    theme.secondary
  );


  root.style.setProperty(
    "--characteristic-background",
    theme.accentBackground
  );

}


/* ============================================================
   SET TEXT SAFELY
   ============================================================ */

function setText(
  elementId,
  value
) {


  const element =
    document.getElementById(
      elementId
    );


  if (!element) {

    console.warn(
      `Element #${elementId} was not found.`
    );

    return;

  }


  element.textContent =
    value ?? "";

}


/* ============================================================
   RENDER EXPLANATION
   ============================================================ */

function renderExplanation(
  paragraphs
) {


  const container =
    document.getElementById(
      "explanation"
    );


  if (!container) {

    return;

  }


  container.innerHTML = "";


  if (
    !Array.isArray(paragraphs)
  ) {

    return;

  }


  paragraphs.forEach(
    paragraph => {


      const p =
        document.createElement(
          "p"
        );


      p.textContent =
        paragraph;


      container.appendChild(
        p
      );

    }
  );

}


/* ============================================================
   RENDER EXAMPLE / CODE
   ============================================================ */

function renderExample(
  example
) {


  const codeElement =
    document.getElementById(
      "exampleCode"
    );


  if (!codeElement) {

    return;

  }


  if (!example) {

    codeElement.textContent =
      "";

    return;

  }


  codeElement.textContent =
    example.code ?? "";

}


/* ============================================================
   RENDER CHARACTERISTIC CARDS
   ============================================================ */

function renderCharacteristics(
  characteristics
) {


  const container =
    document.getElementById(
      "characteristics"
    );


  if (!container) {

    return;

  }


  container.innerHTML = "";


  if (
    !Array.isArray(characteristics)
  ) {

    return;

  }


  characteristics.forEach(
    (item, index) => {


      const card =
        document.createElement(
          "article"
        );


      card.className =
        "characteristic-card";


      /* ======================================================
         ICON
         ====================================================== */

      const icon =
        document.createElement(
          "div"
        );


      icon.className =
        "characteristic-icon";


      icon.setAttribute(
        "aria-hidden",
        "true"
      );


      icon.textContent =
        item.icon ?? "•";


      /* ======================================================
         TITLE
         ====================================================== */

      const title =
        document.createElement(
          "h3"
        );


      title.textContent =
        item.title ?? "";


      /* ======================================================
         DESCRIPTION
         ====================================================== */

      const description =
        document.createElement(
          "p"
        );


      description.textContent =
        item.description ?? "";


      /* ======================================================
         BUILD CARD
         ====================================================== */

      card.appendChild(
        icon
      );


      card.appendChild(
        title
      );


      card.appendChild(
        description
      );


      container.appendChild(
        card
      );

    }
  );

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
  "DOMContentLoaded",
  () => {

    loadTutorialContent();

  }
);