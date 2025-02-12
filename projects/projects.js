import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

const projects = await fetchJSON('../lib/projects.json');

const projectsContainer = document.querySelector('.projects');
renderProjects(projects, projectsContainer, 'h2');

let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);

let arc = arcGenerator({
    startAngle: 0,
    endAngle: 2 * Math.PI,
});

let rolledData = d3.rollups(
    projects,
    (v) => v.length,
    (d) => d.year,
);

let data = rolledData.map(([year, count]) => {
    return { value: count, label: year };
});

let sliceGenerator = d3.pie().value((d) => d.value);

let arcData = sliceGenerator(data);

let arcs = arcData.map((d) => arcGenerator(d));
let colors = d3.scaleOrdinal(d3.schemeTableau10);

arcs.forEach((arc, idx) => {
    d3.select('svg')
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) 
})

let legend = d3.select('.legend');
data.forEach((d, idx) => {
    legend.append('li')
          .attr('style', `--color:${colors(idx)}`)
          .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`); 
})

let query = '';
let selectedYear = null;

// function applyFilters() {
//     let filteredProjects = projects.filter(project => {
//         let matchesQuery = !query || Object.values(project).join(' ').toLowerCase().includes(query.toLowerCase());
//         let matchesYear = !selectedYear || project.year === selectedYear;
//         return matchesQuery && matchesYear;
//     });
//     renderProjects(filteredProjects, projectsContainer, 'h2');
//     renderPieChart(filteredProjects);
// }

let selectedIndex = -1;

function setQuery(newQuery) {
    query = newQuery;
    let filteredProjects = projects.filter((project) => {
        if (query) {
            let values = Object.values(project).join('\n').toLowerCase();
            return values.includes(query.toLowerCase());
        }
      
        return true;
    });
    return filteredProjects
}

function filterProjectsByYear(year) {
    // if (selectedIndex === -1) {
    //     renderProjects(projects, projectsContainer, 'h2');
    // } else {
    //     let filteredProjects = projects.filter((project) => project.year === year);
    //     renderProjects(filteredProjects, projectsContainer, 'h2');
    // }

    let filteredProjects = projects.filter((project) => {
        let matchesYear = selectedIndex === -1 || project.year === year;
        let matchesQuery = !query || Object.values(project).join(' ').toLowerCase().includes(query.toLowerCase());
        return matchesYear && matchesQuery;
    });

    renderProjects(filteredProjects, projectsContainer, 'h2');
}

function renderPieChart(projectsGiven) {
   // re-calculate rolled data
   let newRolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );

  // re-calculate data
  let newData = newRolledData.map(([year, count]) => {
      return { value: count, label: year };
  });

  // re-calculate slice generator, arc data, arc, etc.
  let newSliceGenerator = d3.pie().value((d) => d.value);
  let newArcData = newSliceGenerator(newData);
  let newArcs = newArcData.map((d) => arcGenerator(d));
  
  let newSVG = d3.select('svg'); 
  newSVG.selectAll('path').remove();

  let newLegend = d3.select('.legend');
  newLegend.selectAll('li').remove();

  // update paths and legends, refer to steps 1.4 and 2.2
  newArcs.forEach((arc, idx) => {
      newSVG
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(idx)) 
      .on('click', () => {
        // selectedYear = selectedYear === newData[idx].label ? null : newData[idx].label;
        // applyFilters();

        selectedIndex = selectedIndex === idx ? -1 : idx;
        newSVG.selectAll('path').attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));
        newLegend.selectAll('li').attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));

        filterProjectsByYear(selectedIndex === -1 ? null : newData[selectedIndex].label);

        // if (selectedIndex === -1) {
        //     renderProjects(projects, projectsContainer, 'h2');
        //   } else {
        //     filterProjectsByYear(newData[selectedIndex].label);
        //   }
    });
  })

  newData.forEach((d, idx) => {
      newLegend.append('li')
      .attr('style', `--color:${colors(idx)}`)
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => {
        // selectedYear = selectedYear === d.label ? null : d.label;
        // applyFilters();

        selectedIndex = selectedIndex === idx ? -1 : idx;
        newSVG.selectAll('path').attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));
        newLegend.selectAll('li').attr('class', (_, idx) => (selectedIndex === idx ? 'selected' : ''));
        if (selectedIndex === -1) {
            renderProjects(projects, projectsContainer, 'h2');
          } else {
            filterProjectsByYear(newData[selectedIndex].label);
          }
        });
  });
}

// document.querySelector('.searchBar').addEventListener('input', (event) => {
//     query = event.target.value;
//     applyFilters();
// });

renderPieChart(projects);

let searchInput = document.querySelector('.searchBar');

searchInput.addEventListener('input', (event) => {
    let filteredProjects = setQuery(event.target.value);
   
    renderProjects(filteredProjects, projectsContainer, 'h2');
    renderPieChart(filteredProjects);
});