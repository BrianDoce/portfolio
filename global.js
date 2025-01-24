console.log('IT’S ALIVE!');

function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}

// let navLinks = $$("nav a");

// let currentLink = navLinks.find(
//     (a) => a.host === location.host && a.pathname === location.pathname
//   );

// currentLink?.classList.add('current');

let pages = [
    { url: '', title: 'Home' },
    { url: 'projects/', title: 'Projects' },
    { url: 'Resume/', title: 'Resume'},
    { url: 'contact/', title: 'Contact'},
    { url: 'https://github.com/BrianDoce', title: 'GitHub'}

];

let nav = document.createElement('nav');
document.body.prepend(nav);

const ARE_WE_HOME = document.documentElement.classList.contains('home');

for (let p of pages) {
    let url = p.url;
    
    if (!ARE_WE_HOME && !url.startsWith('http')) {
        url = '../' + url;
    }
    
    let title = p.title;
    let a = document.createElement('a');
    a.href = url;
    a.textContent = title;
    nav.append(a);

    if (a.host === location.host && a.pathname === location.pathname) {
        a.classList.add('current');
    }

    if (a.host !== location.host) {
        a.target = "_blank";
    }
}

document.body.insertAdjacentHTML(
    'afterbegin',
    `
      <label class="color-scheme">
          Theme:
          <select>
                <option value="light dark">Automatic</option>
                <option value="light">Light</option>
                <option value="dark">Dark</option>
          </select>
      </label>`
);

const select = document.querySelector(".color-scheme select");

select.addEventListener('input', function (event) {
    console.log('color scheme changed to', event.target.value);
    document.documentElement.style.setProperty('color-scheme', event.target.value);

    localStorage.colorScheme = event.target.value
});


if ("colorScheme" in localStorage) {
    document.documentElement.style.setProperty('color-scheme', localStorage.colorScheme);
    select.value = localStorage.colorScheme;
}

const form = document.querySelector("form");

form?.addEventListener("submit", function (event) {
    event.preventDefault(); 

    const data = new FormData(form);

    let url = form.action + "?";

    for (let [name, value] of data) {
        // value = encodeURIComponent(value); 
        // url += `${encodeURIComponent(name)}=${value}&`; 
        console.log('name:', name);
        console.log('value:', value);
        console.log('encode:', encodeURIComponent(value))
    }

    // Remove the trailing '&' and set the location to the mailto URL
    url = url.slice(0, -1); // Remove the last '&' character
    location.href = url; 
});
