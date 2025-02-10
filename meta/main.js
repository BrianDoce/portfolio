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
});

let commits = d3.groups(data, (d) => d.commit);
function processCommits() {
    commits = d3
      .groups(data, (d) => d.commit)
      .map(([commit, lines]) => {
        // Each 'lines' array contains all lines modified in this commit
        // All lines in a commit have the same author, date, etc.
        // So we can get this information from the first line
        let first = lines[0];
        
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
      });
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

    // Maximum depth
    let maxDepth = d3.max(data, d => d.depth);
    dl.append('dt').text('Maximum depth');
    dl.append('dd').text(maxDepth);

    // Average depth
    let avgDepth = d3.mean(data, d => d.depth);
    dl.append('dt').text('Average depth');
    dl.append('dd').text(avgDepth.toFixed(2));

    // Time of day most work is done
    let peakHour = d3.rollups(commits, v => v.length, d => Math.floor(d.hourFrac));
    let mostActiveHour = d3.max(peakHour, d => d[1]);
    let activeHour = peakHour.find(d => d[1] === mostActiveHour)[0];
    dl.append('dt').text('Most active hour');
    dl.append('dd').text(`${activeHour}:00 - ${activeHour + 1}:00`);
  }