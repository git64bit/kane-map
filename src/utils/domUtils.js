(function kaneMapDomUtils(global) {
  "use strict";

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function dateStamp() {
    return new Date().toISOString().slice(0, 10);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopyText(text));
      return;
    }
    fallbackCopyText(text);
  }

  function fallbackCopyText(text) {
    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.left = "-9999px";
    document.body.appendChild(box);
    box.select();
    try { document.execCommand("copy"); } catch (error) { /* copy fallback failed */ }
    document.body.removeChild(box);
  }

  global.KaneMapDomUtils = {
    escapeHtml,
    dateStamp,
    copyText
  };
})(window);
