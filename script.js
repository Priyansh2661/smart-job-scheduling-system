// ---------- Sample data ----------
let jobs = [
  { name: "J1", arrival: 0, burst: 6, priority: 3, deadline: 14 },
  { name: "J2", arrival: 1, burst: 3, priority: 1, deadline: 6 },
  { name: "J3", arrival: 2, burst: 8, priority: 4, deadline: 25 },
  { name: "J4", arrival: 3, burst: 2, priority: 2, deadline: 9 },
  { name: "J5", arrival: 5, burst: 4, priority: 1, deadline: 20 },
];

// ---------- Scheduling algorithms ----------
// Each one is a rule for choosing the next job from those waiting.
const ALGORITHMS = {
  "FCFS (First Come First Served)": (a, b) => a.arrival - b.arrival,
  "SJF (Shortest Job First)":       (a, b) => a.burst - b.burst,
  "Priority":                       (a, b) => a.priority - b.priority || a.arrival - b.arrival,
  "EDF (Earliest Deadline First)":  (a, b) => a.deadline - b.deadline,
};

// Run jobs one at a time (non-preemptive) using the given comparison rule.
function runSchedule(jobList, compare) {
  let pending = jobList.map(j => ({ ...j }));
  const done = [];
  let time = 0;

  while (pending.length > 0) {
    const ready = pending.filter(j => j.arrival <= time);

    if (ready.length === 0) {            // idle until the next job arrives
      time = Math.min(...pending.map(j => j.arrival));
      continue;
    }

    ready.sort(compare);
    const job = ready[0];
    job.start = time;
    job.finish = time + job.burst;
    job.waiting = job.start - job.arrival;
    job.turnaround = job.finish - job.arrival;
    job.missed = job.finish > job.deadline;
    time = job.finish;

    pending = pending.filter(j => j !== job);
    done.push(job);
  }
  return done;
}

function evaluate(done) {
  const n = done.length;
  return {
    avgWaiting: done.reduce((s, j) => s + j.waiting, 0) / n,
    avgTurnaround: done.reduce((s, j) => s + j.turnaround, 0) / n,
    missed: done.filter(j => j.missed).length,
  };
}

// The "smart" part: try every algorithm, pick the one with the fewest
// missed deadlines, then the lowest average waiting time.
function smartSchedule(jobList) {
  const results = {};
  for (const [name, compare] of Object.entries(ALGORITHMS)) {
    const done = runSchedule(jobList, compare);
    results[name] = { done, stats: evaluate(done) };
  }

  const best = Object.keys(results).reduce((a, b) => {
    const ra = results[a].stats, rb = results[b].stats;
    if (ra.missed !== rb.missed) return ra.missed < rb.missed ? a : b;
    return ra.avgWaiting <= rb.avgWaiting ? a : b;
  });

  return { best, results };
}

// ---------- Job input table ----------
const tbody = document.querySelector("#jobTable tbody");

function renderJobs() {
  tbody.innerHTML = "";
  jobs.forEach((job, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="name" value="${job.name}" data-i="${i}" data-f="name"></td>
      <td><input type="number" min="0" value="${job.arrival}" data-i="${i}" data-f="arrival"></td>
      <td><input type="number" min="1" value="${job.burst}" data-i="${i}" data-f="burst"></td>
      <td><input type="number" min="1" value="${job.priority}" data-i="${i}" data-f="priority"></td>
      <td><input type="number" min="1" value="${job.deadline}" data-i="${i}" data-f="deadline"></td>
      <td><button class="remove" data-remove="${i}" title="Remove job">&times;</button></td>`;
    tbody.appendChild(tr);
  });
}

tbody.addEventListener("input", e => {
  const { i, f } = e.target.dataset;
  if (i === undefined) return;
  jobs[i][f] = f === "name" ? e.target.value : Number(e.target.value);
});

tbody.addEventListener("click", e => {
  const idx = e.target.dataset.remove;
  if (idx === undefined) return;
  jobs.splice(Number(idx), 1);
  renderJobs();
});

document.getElementById("addBtn").addEventListener("click", () => {
  jobs.push({ name: "J" + (jobs.length + 1), arrival: 0, burst: 1, priority: 1, deadline: 10 });
  renderJobs();
});

// ---------- Show results ----------
function showResults() {
  if (jobs.length === 0) {
    alert("Please add at least one job.");
    return;
  }

  const { best, results } = smartSchedule(jobs);
  const container = document.getElementById("results");
  container.innerHTML = "";

  document.getElementById("bestBox").textContent =
    "Best algorithm for this workload: " + best;

  for (const [name, { done, stats }] of Object.entries(results)) {
    const rows = done.map(j => `
      <tr>
        <td>${j.name}</td><td>${j.start}</td><td>${j.finish}</td>
        <td>${j.waiting}</td><td>${j.deadline}</td>
        <td class="${j.missed ? "no" : "yes"}">${j.missed ? "No" : "Yes"}</td>
      </tr>`).join("");

    const gantt = done.map(j =>
      `<div class="${j.missed ? "late" : ""}" style="flex:${j.burst}" title="${j.start} to ${j.finish}">${j.name}</div>`
    ).join("");

    const card = document.createElement("div");
    card.className = "algo" + (name === best ? " winner" : "");
    card.innerHTML = `
      <h3>${name}${name === best ? '<span class="badge">BEST</span>' : ""}</h3>
      <div class="gantt">${gantt}</div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Job</th><th>Start</th><th>Finish</th><th>Wait</th><th>Deadline</th><th>Met?</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
      <p class="stats">Avg waiting: <b>${stats.avgWaiting.toFixed(2)}</b> |
        Avg turnaround: <b>${stats.avgTurnaround.toFixed(2)}</b> |
        Missed deadlines: <b>${stats.missed}</b></p>`;
    container.appendChild(card);
  }

  const section = document.getElementById("resultSection");
  section.hidden = false;
  section.scrollIntoView({ behavior: "smooth" });
}

document.getElementById("runBtn").addEventListener("click", showResults);

renderJobs();
