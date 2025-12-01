const scrollToTop = () => {  
    window.scrollTo({ top: 0, behavior: "smooth" });
};

const scrollToBottom = (smooth = true) => {
  window.scrollTo({
    top: document.documentElement.scrollHeight,
    behavior: smooth ? "smooth" : "auto",
  });
};


const scrollToId = (id: string, smooth = true) => {
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      block: "start",
    });
  }
};

export {scrollToTop, scrollToBottom, scrollToId};
