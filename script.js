document.querySelectorAll('.nav a').forEach(link => {
  link.addEventListener('click', function() {
    // 全リンクの active を消す
    document.querySelectorAll('.nav a').forEach(l => l.classList.remove('active'));
    // クリックしたリンクに active をつける
    this.classList.add('active');
  });
});