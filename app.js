(function () {
  const STYLE_STORAGE_KEY = "direwolfSelectedStyle";
  const DEFAULT_STYLE_FILE = "style_default.css";
  const AVAILABLE_STYLE_FILES = [
    "style_default.css",
    "style_folder.css",
    "style_high_contrast.css",
    "style_neon.css",
    "style_console.css"
  ];

  function getStyleFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("style");
  }

  function setStyleInUrl(styleFile) {
    const url = new URL(window.location.href);
    url.searchParams.set("style", styleFile);
    window.history.replaceState({}, "", url);
  }

  function isValidStyleFile(styleFile) {
    return typeof styleFile === "string" && /^style_[a-z0-9_\-]+\.css$/i.test(styleFile);
  }

  function toStylePath(styleFile) {
    return `styles/${styleFile}`;
  }

  function getAvailableStyleFiles() {
    return AVAILABLE_STYLE_FILES.filter(isValidStyleFile);
  }

  function resolveInitialStyle(availableStyles) {
    const urlStyle = getStyleFromUrl();
    const savedStyle = window.localStorage.getItem(STYLE_STORAGE_KEY);
    const preferredStyle = urlStyle || savedStyle || DEFAULT_STYLE_FILE;

    if (availableStyles.includes(preferredStyle)) {
      return preferredStyle;
    }

    return DEFAULT_STYLE_FILE;
  }

  function applyStyle(styleFile) {
    const stylesheet = document.getElementById("themeStylesheet");
    if (!stylesheet) return;
    stylesheet.setAttribute("href", toStylePath(styleFile));
    setStyleInUrl(styleFile);
    window.localStorage.setItem(STYLE_STORAGE_KEY, styleFile);
  }

  function populateStyleMenu(styleSelect, availableStyles, activeStyle) {
    styleSelect.innerHTML = "";

    availableStyles.forEach(function (styleFile) {
      const option = document.createElement("option");
      option.value = styleFile;
      option.textContent = styleFile.replace(/^style_|\.css$/g, "").replace(/_/g, " ");
      styleSelect.appendChild(option);
    });

    styleSelect.value = activeStyle;
  }

  function mulberry32(a) {
    return function () {
      let t = (a += 0x6D2B79F5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(seedText) {
    let h = 1779033703 ^ seedText.length;
    for (let i = 0; i < seedText.length; i++) {
      h = Math.imul(h ^ seedText.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }

  function createRng(seedValue) {
    const seedFactory = hashSeed(String(seedValue));
    return mulberry32(seedFactory());
  }

  function pick(rng, array) {
    return array[Math.floor(rng() * array.length)];
  }

  function getSeedFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get("seed");
  }

  function setSeedInUrl(seed) {
    const url = new URL(window.location.href);
    url.searchParams.set("seed", seed);
    window.history.replaceState({}, "", url);
  }

  function makeSeed() {
    return Math.floor(Math.random() * 1000000000).toString();
  }

  function fillTags(template, rng) {
    return template.replace(/\{([a-zA-Z0-9_]+):([a-zA-Z0-9_]+)\}/g, function (_, type, key) {
      const table = window.MISSION_TABLES[key];
      if (!table) return `{${type}:${key}}`;
      return `<i>${pick(rng, table)}</i>`;
    }).replace(/\{([a-zA-Z0-9_]+)\}/g, function (_, key) {
      const table = window.MISSION_TABLES[key];
      if (!table) return `{${key}}`;
      return `<i>${pick(rng, table)}</i>`;
    });
  }

  function generateMission(seed) {
    const rng = createRng(seed);
    const city = pick(rng, window.MISSION_CITIES);
    const site = pick(rng, window.MISSION_SITES);
    const event = pick(rng, window.MISSION_EVENTS);
    const body = fillTags(event.template, rng);

    const hook = `Division Control assigns the team to ${city.name}, ${city.country}. The incident centres on a ${site.name.toLowerCase()}, where local authorities have contained the situation badly and witnesses are starting to talk.`;

    return { seed, city, site, event, body, hook };
  }

  function renderMission(mission) {
    document.getElementById("seedValue").textContent = mission.seed;
    document.getElementById("cityName").textContent = mission.city.name;
    document.getElementById("cityMeta").textContent = `${mission.city.country} • ${mission.city.region}`;
    document.getElementById("siteName").textContent = mission.site.name;
    document.getElementById("siteDesc").textContent = mission.site.description;
    document.getElementById("missionTitle").textContent = mission.event.title;
    document.getElementById("missionBody").innerHTML = mission.body;
    document.getElementById("missionThreat").textContent = mission.event.threat;
    document.getElementById("missionTone").textContent = mission.event.tone;
    document.getElementById("briefingHook").textContent = mission.hook;
  }

  function refresh(seed) {
    setSeedInUrl(seed);
    renderMission(generateMission(seed));
  }

  const newSeedBtn = document.getElementById("newSeedBtn");
  const copyLinkBtn = document.getElementById("copyLinkBtn");
  const direwolfLogoBtn = document.getElementById("direwolfLogo");
  const styleMenu = document.getElementById("styleMenu");
  const styleSelect = document.getElementById("styleSelect");

  function initializeStyleSelector() {
    const availableStyles = getAvailableStyleFiles();
    const activeStyle = resolveInitialStyle(availableStyles);
    applyStyle(activeStyle);
    populateStyleMenu(styleSelect, availableStyles, activeStyle);

    direwolfLogoBtn.addEventListener("click", function () {
      const currentlyHidden = styleMenu.hasAttribute("hidden");
      if (currentlyHidden) {
        styleMenu.removeAttribute("hidden");
        styleSelect.focus();
      } else {
        styleMenu.setAttribute("hidden", "");
      }
    });

    styleSelect.addEventListener("change", function (event) {
      applyStyle(event.target.value);
    });

    document.addEventListener("click", function (event) {
      if (!styleMenu.hasAttribute("hidden") && !styleMenu.contains(event.target) && event.target !== direwolfLogoBtn && !direwolfLogoBtn.contains(event.target)) {
        styleMenu.setAttribute("hidden", "");
      }
    });
  }

  newSeedBtn.addEventListener("click", function () {
    refresh(makeSeed());
  });

  copyLinkBtn.addEventListener("click", async function () {
    try {
      await navigator.clipboard.writeText(window.location.href);
      copyLinkBtn.textContent = "Copied";
      setTimeout(function () {
        copyLinkBtn.textContent = "Copy Link";
      }, 1200);
    } catch (err) {
      copyLinkBtn.textContent = "Copy failed";
      setTimeout(function () {
        copyLinkBtn.textContent = "Copy Link";
      }, 1200);
    }
  });

  initializeStyleSelector();

  const initialSeed = getSeedFromUrl() || makeSeed();
  refresh(initialSeed);
})();
