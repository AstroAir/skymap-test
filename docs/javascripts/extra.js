// 自定义脚本

// 添加代码复制提示
document.addEventListener('DOMContentLoaded', function() {
  const copyButtons = document.querySelectorAll('.copy-button');
  copyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const originalText = button.textContent;
      button.textContent = '已复制!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 2000);
    });
  });
});

// 滚动时高亮当前章节
document.addEventListener('scroll', function() {
  const headers = document.querySelectorAll('.md-typeset h2, .md-typeset h3');
  const tocLinks = document.querySelectorAll('.md-nav__link');

  let current = '';
  headers.forEach(header => {
    const sectionTop = header.offsetTop;
    if (scrollY >= sectionTop - 100) {
      current = header.getAttribute('id');
    }
  });

  tocLinks.forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === '#' + current) {
      link.classList.add('active');
    }
  });
});
