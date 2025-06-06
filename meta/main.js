let data = [];

async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
      ...row,
      line: Number(row.line), // or just +row.line
      depth: Number(row.depth),
      length: Number(row.length),
      date: new Date(row.date + 'T00:00' + row.timezone),
      datetime: new Date(row.datetime),
  }));
  displayStats();
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  processCommits();
  createScatterplot();
});

let commits = [];
function processCommits() {
  if (!data || data.length === 0) {
    console.error("No data loaded before processing commits.");
    return;
  }
  commits = d3
    .groups(data, (d) => d.commit)
    .map(([commit, lines]) => {
        // Each 'lines' array contains all lines modified in this commit
        // All lines in a commit have the same author, date, etc.
        // So we can get this information from the first line
  
      let first = lines.length > 0 ? lines[0] : null;
      if (!first) return null; // Skip empty commits
    // What information should we return about this commit?
    let { author, date, time, timezone, datetime } = first;

    let ret = {
        id: commit,
        url: 'https://github.com/BrianDoce/portfolio/commit/' + commit,
        author,
        date,
        time,
        timezone,
        datetime,
        hourFrac: datetime.getHours() + datetime.getMinutes() / 60,
        totalLines: lines.length,
      };
    Object.defineProperty(ret, 'lines', {
        value: lines,
        enumerable: false,
        configurable: false,
        writable: false,
    });

      return ret;
  }).filter(d => d !== null); 
}

function displayStats() {
    // Process commits first
    processCommits();
  
    // Create the dl element
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');
  
    // Add total LOC
    dl.append('dt').html('Total <abbr title="Lines of code">LOC</abbr>');
    dl.append('dd').text(data.length);
  
    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);
  
    // Number of files in the codebase
    let files = new Set(data.map(d => d.file));
    dl.append('dt').text('Total files');
    dl.append('dd').text(files.size);

    // Maximum file length (in lines)
    let fileLengths = d3.rollup(data, v => v.length, d => d.file);
    let maxFileLength = d3.max(fileLengths.values());
    dl.append('dt').text('Longest file (lines)');
    dl.append('dd').text(maxFileLength);

    // Average file length
    let avgFileLength = d3.mean(fileLengths.values());
    dl.append('dt').text('Average file length');
    dl.append('dd').text(avgFileLength.toFixed(2));

    // Time of Day That Most Work is Done
    const workByPeriod = d3.rollups(
      data,
      (v) => v.length,
      (d) => new Date(d.datetime).toLocaleString('en', { dayPeriod: 'short' })
    );
    const maxPeriod = d3.greatest(workByPeriod, (d) => d[1])?.[0];
    dl.append('dt').text('Time of Day That Most Work is Done');
    dl.append('dd').text(maxPeriod);


    // Active Day
    const workByDay = d3.rollups(
      data,
      (v) => v.length, // Count occurrences (lines of code modified)
      (d) => new Date(d.datetime).toLocaleString('en', { weekday: 'long' }) // Get weekday
    );
    const maxDay = d3.greatest(workByDay, (d) => d[1])?.[0]; 
    dl.append('dt').text('Day That Most Work is Done');
    dl.append('dd').text(maxDay);

    // Max line length
    let maxLength = d3.max(data, d => d.length);
    dl.append('dt').text('Longest Line');
    dl.append('dd').text(maxLength);
}
let xScale, yScale;

function createScatterplot() {
    const width = 1000;
    const height = 600;
    const sortedCommits = d3.sort(commits, (d) => -d.totalLines);

    const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

    xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([0, width])
    .nice();
    
    yScale = d3.scaleLinear().domain([0, 24]).range([height, 0]);
        
    const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);
    const rScale = d3.scaleSqrt().domain([minLines, maxLines]).range([5, 30]); // adjust these values based on your experimentation
    
    const margin = { top: 10, right: 10, bottom: 30, left: 20 };
    const usableArea = {
        top: margin.top,
        right: width - margin.right,
        bottom: height - margin.bottom,
        left: margin.left,
        width: width - margin.left - margin.right,
        height: height - margin.top - margin.bottom,
    };
      
    // Update scales with new ranges
    xScale.range([usableArea.left, usableArea.right]);
    yScale.range([usableArea.bottom, usableArea.top]);
    
    // Add gridlines BEFORE the axes
    const gridlines = svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`);

    // Create gridlines as an axis with no labels and full-width ticks
    gridlines.call(d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width));

    // Create the axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
    .axisLeft(yScale)
    .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

    // Add X axis
    svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

    // Add Y axis
    svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    gridlines.selectAll('line')
    .each(function(_, i) {
        const hour = i % 24; // Ensure we cycle through 24-hour format
        d3.select(this).attr('class', hour >= 3 && hour < 10 ? 'day' : 'night');
  });

    const dots = svg.append('g').attr('class', 'dots');
    dots
        .selectAll('circle')
        .data(sortedCommits)
        .join('circle')
        .attr('cx', (d) => xScale(d.datetime))
        .attr('cy', (d) => yScale(d.hourFrac))
        .attr('r', (d) => rScale(d.totalLines)) // Use radius scale
        .style('fill', 'steelblue')
        .style('fill-opacity', 0.7) // Add transparency for overlapping dots
        .on('mouseenter', function (event, commit) {
        d3.select(event.currentTarget)
            .style('fill-opacity', 1) // Highlight on hover
            .attr('stroke', '#333') // Optional: add stroke for better visibility
            .attr('stroke-width', 2);
            updateTooltipContent(commit)
        })
        .on('mouseleave', function () {
        d3.select(event.currentTarget)
            .style('fill-opacity', 0.7) // Restore transparency
            .attr('stroke', 'none'); // Remove stroke after hover
            updateTooltipContent({});
        });
    brushSelector();
}

function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
}

function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
}

function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
}

function brushSelector() {
    const svg = document.querySelector('svg');
    d3.select(svg).call(d3.brush().on('start brush end', brushed));

    // Raise dots and everything after overlay
    d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
}

let brushSelection = null;

function brushed(event) {
    brushSelection = event.selection;
    updateSelection();
    updateSelectionCount();
    updateLanguageBreakdown();
}

function isCommitSelected(commit) {
    if (!brushSelection) {
      return false;
    }
    // TODO: return true if commit is within brushSelection
    // and false if not
    const min = { x: brushSelection[0][0], y: brushSelection[0][1] }; 
    const max = { x: brushSelection[1][0], y: brushSelection[1][1] }; 
    
    const x = xScale(commit.date); 
    const y = yScale(commit.hourFrac); 

    return x >= min.x && x <= max.x && y >= min.y && y <= max.y; 

    // const [[x0, y0], [x1, y1]] = brushSelection;
    // const x = xScale(commit.datetime);
    // const y = yScale(commit.hourFrac);

    // return x0 <= x && x <= x1 && y0 <= y && y <= y1;
}
  
function updateSelection() {
    // Update visual state of dots based on selection
    d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
}

function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
  }