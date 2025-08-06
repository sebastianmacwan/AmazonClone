function mode() {
  const body = document.body;
  const currentTheme = localStorage.getItem('theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  if (newTheme === 'dark') {
    body.classList.add('dark-mode');
    body.classList.remove('bg-white', 'text-dark');
  } else {
    body.classList.remove('dark-mode');
    body.classList.add('bg-white', 'text-dark');
  }

  localStorage.setItem('theme', newTheme);
}

document.addEventListener("DOMContentLoaded", async () => {
  // Apply theme on load
  const savedTheme = localStorage.getItem('theme') || 'light';
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    document.body.classList.remove('bg-white', 'text-dark');
  } else {
    document.body.classList.add('bg-white', 'text-dark');
    document.body.classList.remove('dark-mode');
  }

  updateUserNameDisplay();
  await fetchProducts();
  await renderNav();
  if (currentUser && currentUser.id) {
    await updateNavCartCount();
  }
});
