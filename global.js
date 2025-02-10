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
    { url: 'meta/', title: 'Meta'},
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
        url += name + '=' + encodeURIComponent(value) + '&';
    }
    
    
    url = url.slice(0, -1); 
    location.href = url; 
});

export async function fetchJSON(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Failed to fetch projects: ${response.statusText}`);
        }

        console.log(response)

        const data = await response.json();
        return data; 

    } catch (error) {
        console.error('Error fetching or parsing JSON data:', error);
    }
}

export function renderProjects(project, containerElement, headingLevel = 'h2') {
    containerElement.innerHTML = '';
    const projectTitle = document.querySelector('.projects-title');
    
    if (projectTitle) {
        projectTitle.textContent = `${project.length} Projects`;
    }

    for (const obj of project) {
        const article = document.createElement('article');
        
        article.innerHTML = `
            <h3>${obj.title}</h3>
            <img src="${obj.image}" alt="${obj.title}">
            <div>
                <p>${obj.description}</p>
                <footer class="year">${obj.year}</footer>
            </div>
        `;
        
        containerElement.appendChild(article);
    }
}

export async function fetchGitHubData(username) {
    return fetchJSON(`https://api.github.com/users/${username}`);
}
