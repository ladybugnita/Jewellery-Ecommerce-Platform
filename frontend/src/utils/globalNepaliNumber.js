import { toNepaliDigits, toEnglishDigits } from './nepaliFormat';

let observer = null;

const shouldSkip = (text) => {
  if (!text) return true;

  if (
    text.includes('@') ||
    text.includes('://') ||
    text.includes('Bearer')
  ) {
    return true;
  }

  return false;
};

const convertText = (text, isNepali) => {
  if (shouldSkip(text)) return text;

  if (/\d/.test(text)) {
    return isNepali
      ? toNepaliDigits(text)
      : toEnglishDigits(text);
  }

  return text;
};

const walk = (node, isNepali) => {
  if (node.nodeType === Node.TEXT_NODE) {
    node.nodeValue = convertText(node.nodeValue, isNepali);
    return;
  }

  node.childNodes.forEach(child => walk(child, isNepali));
};

export const convertEntirePageNumbers = (isNepali) => {
  const root = document.body;
  if (!root) return;

  walk(root, isNepali);

  // observe DOM changes
  if (observer) observer.disconnect();

  observer = new MutationObserver(() => {
    walk(root, isNepali);
  });

  observer.observe(root, {
    childList: true,
    subtree: true,
  });
};