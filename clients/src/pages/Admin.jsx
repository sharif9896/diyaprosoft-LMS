import {DashboardGreeting,MotivationTypewriter} from '../DashboardGreeting';
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  BookOpen,
  ClipboardList,
  ListChecks,
  ArrowUpRight,
  Plus,
  Download,
  Upload,
  ChevronDown,
  Pencil,
  Trash2,
  CheckCircle2,
  TrendingUp,
  Clock3,
  FileSpreadsheet,
  FileText,
  Search,
  ArrowRight,
  Layers,
  ShieldCheck,
} from "lucide-react";
import { api, download, fmtDate, useLocalTime } from "../api";
import { useAuth, useToast } from "../main";
import { useFeedback } from "../feedback";
import {
  useData,
  Loading,
  ErrorState,
  Empty,
  Badge,
  Avatar,
  Modal,
  PageHeading,
  SearchBox,
  StatCard,
  Pagination,
  Notice,
  ActivityChart,
  TextLink,
} from "../components";
export function AdminDashboard() {
  const { user } = useAuth(),
    navigate = useNavigate();
  const { data: d, loading, error } = useData("/admin/dashboard");
  if (loading) return <Loading />;
  if (error) return <ErrorState error={error} />;
  return (
    <>
      <PageHeading
        eyebrow="A CLEARER VIEW OF YOUR CAMPUS"
        title={<DashboardGreeting name={user.name}/>}
        description={<MotivationTypewriter/>}
      >
        <Link className="btn" to="/admin/results">
          <Download size={16} />
          View reports
        </Link>
        <Link className="btn primary" to="/admin/exams?new=1">
          <Plus size={18} />
          Create examination
        </Link>
      </PageHeading>
      <div className="welcome-banner">
        <div>
          <span className="banner-tag">
            <span /> YOUR WORKSPACE, AT A GLANCE
          </span>
          <h2>
            Great learning starts with
            <br />a well-managed classroom.
          </h2>
          <p>
            Connect your courses, empower your students, and make every test
            count.
          </p>
          <Link to="/admin/courses">
            Explore your courses
            <ArrowRight size={16} />
          </Link>
        </div>
        <div className="banner-art" aria-hidden="true">
          <div className="banner-circle" />
          <div className="banner-book">
            <BookOpen size={76} strokeWidth={1.25} />
          </div>
          <div className="banner-float one">
            <CheckCircle2 size={18} />
            Ready to achieve
          </div>
          <div className="banner-float two">
            <GraduationCapIcon />
          </div>
          <span className="spark spark-one">✦</span>
          <span className="spark spark-two">✦</span>
        </div>
      </div>
      <div className="stats-grid">
        <StatCard
          label="Total students"
          value={d.students.toLocaleString()}
          icon={Users}
          note="Students in your workspace"
        />
        <StatCard
          label="Total courses"
          value={d.courses}
          icon={BookOpen}
          tone="blue"
          note="Learning paths managed"
        />
        <StatCard
          label="Examinations"
          value={d.exams}
          icon={ClipboardList}
          tone="orange"
          note="Draft and published tests"
        />
        <StatCard
          label="Overall pass rate"
          value={`${d.passRate}%`}
          icon={TrendingUp}
          tone="green"
          note={`${d.totalAttempts} completed attempts`}
        />
      </div>
      <div className="dashboard-middle">
        <section className="panel performance-panel">
          <div className="panel-heading">
            <div>
              <h3>Examination activity</h3>
              <p>A little progress, every month.</p>
            </div>
            <span className="subtle-tag">Last 6 months</span>
          </div>
          <div className="chart-summary">
            <strong>
              {d.totalAttempts}
              <span>completed attempts</span>
            </strong>
            <div className="chart-legend">
              <span>
                <i className="dot purple" />
                Attempts
              </span>
              <span>
                <i className="dot green" />
                Passed
              </span>
            </div>
          </div>
          <ActivityChart months={d.months} />
        </section>
        <section className="panel course-overview">
          <div className="panel-heading">
            <div>
              <h3>Course enrollment</h3>
              <p>Where your students are learning.</p>
            </div>
            <Layers size={19} />
          </div>
          {d.courseStats.length ? (
            d.courseStats.map((c, i) => (
              <div className="course-stat" key={c._id}>
                <div className={`course-mini tone-${i % 4}`}>
                  <BookOpen size={18} />
                </div>
                <div>
                  <div className="course-stat-label">
                    <strong>{c.title}</strong>
                    <span>{c.count}</span>
                  </div>
                  <div className="mini-progress">
                    <i
                      style={{
                        width: `${Math.max(2, (c.count / Math.max(d.students, 1)) * 100)}%`,
                        background: [
                          "#12386b",
                          "#5c7fa9",
                          "#94a3b8",
                          "#64748b",
                        ][i % 4],
                      }}
                    />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="Your first course awaits"
              text="Add a course to begin enrolling students."
            />
          )}
          <button
            className="all-courses"
            onClick={() => navigate("/admin/courses")}
          >
            View all courses
            <ArrowUpRight size={15} />
          </button>
        </section>
      </div>
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h3>Recent examination results</h3>
            <p>The latest milestones from your students.</p>
          </div>
          <TextLink onClick={() => navigate("/admin/results")}>
            View all results
          </TextLink>
        </div>
        {d.recent.length ? (
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  <th>STUDENT</th>
                  <th>EXAMINATION</th>
                  <th>COURSE</th>
                  <th>SCORE</th>
                  <th>STATUS</th>
                  <th>COMPLETED</th>
                </tr>
              </thead>
              <tbody>
                {d.recent.map((r) => (
                  <tr key={r._id}>
                    <td>
                      <div className="person-cell">
                        <Avatar name={r.student?.name} />
                        <div>
                          <strong>{r.student?.name || "Student"}</strong>
                          <span>{r.student?.studentId}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong>{r.examTitle}</strong>
                      <small>Attempt {r.attemptNumber}</small>
                    </td>
                    <td>
                      <span className="code-chip">{r.courseCode}</span>
                    </td>
                    <td>
                      <strong>{r.percentage}%</strong>
                      <small>
                        {r.score} / {r.maxScore} marks
                      </small>
                    </td>
                    <td>
                      <Badge value={r.passed ? "passed" : "failed"} />
                    </td>
                    <td className="muted">{fmtDate(r.submittedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="The next milestone is on its way"
            text="Completed examinations will appear here."
          />
        )}
      </section>
      <div className="bottom-note">
        <ShieldCheck size={15} />A connected workspace for every step of the
        learning journey.
        <span>{d.questions} questions in your question bank</span>
      </div>
    </>
  );
}
function GraduationCapIcon() {
  return <span className="graduation-glyph">✦</span>;
}
const config = {
  students: {
    title: "Students",
    singular: "student",
    description:
      "A space for every learner. Manage profiles, access, and course enrollments.",
    icon: Users,
  },
  courses: {
    title: "Courses",
    singular: "course",
    description:
      "Build the learning paths that connect students to their next milestone.",
    icon: BookOpen,
  },
  exams: {
    title: "Examinations",
    singular: "examination",
    description:
      "Create thoughtful tests, assign your students, and let progress happen.",
    icon: ClipboardList,
  },
  questions: {
    title: "Question bank",
    singular: "question",
    description:
      "Great examinations start with great questions. Build yours here.",
    icon: ListChecks,
  },
};
const defaults = {
  students: {
    studentId: "",
    name: "",
    email: "",
    dateOfBirth: "",
    phone: "",
    department: "",
    status: "active",
    courseCodes: [],
  },
  courses: {
    code: "",
    title: "",
    description: "",
    instructor: "",
    status: "active",
  },
  exams: {
    code: "",
    title: "",
    courseCode: "",
    durationMinutes: 30,
    questionCount: 5,
    marksPerQuestion: 1,
    passPercentage: 50,
    maxAttempts: 1,
    startsAt: "",
    endsAt: "",
    status: "draft",
    assignedStudentEmails: [],
    shuffleQuestions: true,
  },
  questions: {
    code: "",
    examCode: "",
    courseCode: "",
    text: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctAnswer: "A",
    explanation: "",
  },
};
export function ManageRecords({ entity }) {
  const toast = useToast();
  const feedback = useFeedback();
  const [version, setVersion] = useState(0),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [page, setPage] = useState(1),
    [editor, setEditor] = useState(null),
    [importing, setImporting] = useState(false),
    [deleting, setDeleting] = useState(null),
    [busy, setBusy] = useState(false);
  const { data, loading, error } = useData(`/admin/${entity}`, version);
  const c = config[entity],
    Icon = c.icon;
  useEffect(() => {
    setSearch("");
    setStatus("all");
    setPage(1);
    setEditor(null);
    if (new URLSearchParams(window.location.search).get("new")) {
      setEditor({});
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [entity]);
  useEffect(() => setPage(1), [search, status]);
  const all = data?.records || [],
    records = all.filter(
      (r) =>
        (status === "all" || r.status === status) &&
        Object.values(r).some((v) =>
          String(v ?? "")
            .toLowerCase()
            .includes(search.toLowerCase()),
        ),
    );
  const visible = records.slice((page - 1) * 8, page * 8);
  async function exportData(format) {
    try {
      await download(`/admin/${entity}/export?format=${format}`);
      feedback({title:"Export ready!",eyebrow:"DOWNLOAD COMPLETE",description:`Your ${c.title.toLowerCase()} have been exported as ${format.toUpperCase()}. Check your downloads for the file.`,buttonLabel:"Continue managing"});
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/admin/${entity}/${deleting._id}`, { method: "DELETE" });
      setDeleting(null);
      setVersion((v) => v + 1);
      setPage(1);
      feedback({title:`${c.singular[0].toUpperCase() + c.singular.slice(1)} deleted`,eyebrow:"WORKSPACE UPDATED",description:`${deleting.name || deleting.title || deleting.code} has been deleted successfully.`,buttonLabel:"Continue managing"});
    } catch (e) {
      toast(e.message, "error");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading title={c.title} description={c.description}>
        <button className="btn" onClick={() => setImporting(true)}>
          <Upload size={16} />
          Import
        </button>
        <ExportMenu onExport={exportData} />
        <button className="btn primary" onClick={() => setEditor({})}>
          <Plus size={18} />
          Add {c.singular}
        </button>
      </PageHeading>
      <div className="management-summary">
        <div className="summary-icon">
          <Icon size={23} />
        </div>
        <div>
          <strong>{all.length}</strong>
          <span>
            Total{" "}
            {entity === "questions"
              ? "questions"
              : entity === "exams"
                ? "examinations"
                : entity}
          </span>
        </div>
        {entity !== "questions" && (
          <>
            <span className="summary-divider" />
            <div>
              <strong>
                {
                  all.filter((r) => ["active", "published"].includes(r.status))
                    .length
                }
              </strong>
              <span>{entity === "exams" ? "Published" : "Active"}</span>
            </div>
          </>
        )}
        <p>
          {entity === "questions"
            ? "Organized by course. Ready for your next test."
            : entity === "exams"
              ? "Create a draft → add questions → publish."
              : "Keep your workspace organized and up to date."}
        </p>
      </div>
      <section className="panel records-panel">
        <div className="records-toolbar">
          <div className="section-title">
            <h3>
              All{" "}
              {entity === "exams"
                ? "examinations"
                : entity === "questions"
                  ? "questions"
                  : entity}
            </h3>
            <span className="count-chip">{records.length}</span>
          </div>
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder={`Search ${entity}…`}
            />
            {entity !== "questions" && (
              <select
                aria-label="Filter by status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="all">All statuses</option>
                {(entity === "exams"
                  ? ["draft", "published", "archived"]
                  : entity === "students"
                    ? ["active", "inactive"]
                    : ["active", "archived"]
                ).map((s) => (
                  <option key={s} value={s}>
                    {s[0].toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : !records.length ? (
          <Empty
            title={
              search
                ? "No matching records"
                : `Your first ${c.singular} starts here`
            }
            text={
              search
                ? "Try a different search or status filter."
                : `Add a ${c.singular} manually or import a CSV or Excel file.`
            }
            action={
              !search && (
                <button className="btn primary" onClick={() => setEditor({})}>
                  <Plus size={16} />
                  Add {c.singular}
                </button>
              )
            }
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    {(entity === "students"
                      ? [
                          "STUDENT",
                          "REGISTER NO.",
                          "DEPARTMENT",
                          "COURSES",
                          "STATUS",
                        ]
                      : entity === "courses"
                        ? [
                            "COURSE",
                            "COURSE CODE",
                            "INSTRUCTOR",
                            "DESCRIPTION",
                            "STATUS",
                          ]
                        : entity === "exams"
                          ? [
                              "EXAMINATION",
                              "COURSE",
                              "DURATION",
                              "QUESTIONS",
                              "STATUS",
                            ]
                          : ["QUESTION", "EXAMINATION", "COURSE", "ANSWER"]
                    ).map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                    <th className="align-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {visible.map((r, i) => (
                    <tr key={r._id}>
                      {entity === "students" ? (
                        <>
                          <td>
                            <div className="person-cell">
                              <Avatar
                                name={r.name}
                                color={
                                  ["purple", "blue", "orange", "green"][i % 4]
                                }
                              />
                              <div>
                                <strong>{r.name}</strong>
                                <span>{r.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="mono">{r.studentId}</span>{!r.dateOfBirth&&<span className="birth-date-missing">DOB required for sign-in</span>}
                          </td>
                          <td>{r.department || "—"}</td>
                          <td>
                            <div className="chips">
                              {r.courseCodes.length ? (
                                r.courseCodes.map((code) => (
                                  <span key={code} className="code-chip">
                                    {code}
                                  </span>
                                ))
                              ) : (
                                <span className="muted">Unassigned</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <Badge value={r.status} />
                          </td>
                        </>
                      ) : entity === "courses" ? (
                        <>
                          <td>
                            <div className="person-cell">
                              <span className={`course-mini tone-${i % 4}`}>
                                <BookOpen size={20} />
                              </span>
                              <strong>{r.title}</strong>
                            </div>
                          </td>
                          <td>
                            <span className="code-chip">{r.code}</span>
                          </td>
                          <td>{r.instructor || "—"}</td>
                          <td>
                            <span className="truncate">
                              {r.description || "—"}
                            </span>
                          </td>
                          <td>
                            <Badge value={r.status} />
                          </td>
                        </>
                      ) : entity === "exams" ? (
                        <>
                          <td>
                            <strong>{r.title}</strong>
                            <small>
                              {r.code} · {r.maxAttempts} attempt
                              {r.maxAttempts > 1 ? "s" : ""}
                            </small>
                          </td>
                          <td>
                            <span className="code-chip">{r.courseCode}</span>
                          </td>
                          <td>
                            <span className="inline-icon">
                              <Clock3 size={14} />
                              {r.durationMinutes} min
                            </span>
                          </td>
                          <td>
                            <strong>{r.questionCount}</strong>
                            <small>{r.availableQuestions} in bank</small>
                          </td>
                          <td>
                            <Badge value={r.status} />
                          </td>
                        </>
                      ) : (
                        <>
                          <td>
                            <strong className="truncate wide-text">
                              {r.text}
                            </strong>
                            <small>{r.code}</small>
                          </td>
                          <td>
                            <span className="code-chip">{r.examCode}</span>
                          </td>
                          <td>{r.courseCode}</td>
                          <td>
                            <span className="answer-chip">
                              {r.correctAnswer}
                            </span>
                          </td>
                        </>
                      )}
                      <td>
                        <div className="row-actions">
                          <button
                            className="icon-btn"
                            title={`Edit ${c.singular}`}
                            aria-label={`Edit ${r.name || r.title || r.code}`}
                            onClick={() => setEditor(r)}
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            className="icon-btn danger"
                            title={`Delete ${c.singular}`}
                            aria-label={`Delete ${r.name || r.title || r.code}`}
                            onClick={() => setDeleting(r)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} setPage={setPage} total={records.length} />
          </>
        )}
      </section>
      <div className="import-hint">
        <FileSpreadsheet size={18} />
        <span>
          Have your data in a spreadsheet?{" "}
          <button onClick={() => setImporting(true)}>Import {entity}</button>{" "}
          using our CSV or Excel template.
        </span>
      </div>
      {editor && (
        <RecordEditor
          key={`${entity}-${editor._id || "new"}`}
          entity={entity}
          record={editor}
          onClose={() => setEditor(null)}
          onSaved={() => {
            setEditor(null);
            setVersion((v) => v + 1);
          }}
        />
      )}
      {importing && (
        <ImportDialog
          entity={entity}
          onClose={() => setImporting(false)}
          onImported={() => {
            setVersion((v) => v + 1);
            setPage(1);
          }}
        />
      )}
      {deleting && (
        <Modal
          title={`Delete this ${c.singular}?`}
          onClose={() => !busy && setDeleting(null)}
        >
          <div className="modal-body">
            <p>
              This will delete{" "}
              <strong>
                {deleting.name || deleting.title || deleting.code}
              </strong>
              .{" "}
              {entity === "exams"
                ? "Questions belonging to this exam will also be deleted. "
                : ""}
              Records with examination history are protected from deletion.
            </p>
          </div>
          <div className="modal-footer">
            <button
              className="btn"
              disabled={busy}
              onClick={() => setDeleting(null)}
            >
              Cancel
            </button>
            <button
              className="btn destructive"
              disabled={busy}
              onClick={remove}
            >
              {busy ? "Deleting…" : "Delete " + c.singular}
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
export function ExportMenu({ onExport }) {
  return (
    <details className="export-menu">
      <summary className="btn">
        <Download size={16} />
        Export
        <ChevronDown size={14} />
      </summary>
      <div className="dropdown">
        <button
          onClick={(e) => {
            e.currentTarget.closest("details").open = false;
            onExport("csv");
          }}
        >
          <FileText size={16} />
          CSV file<span>.csv</span>
        </button>
        <button
          onClick={(e) => {
            e.currentTarget.closest("details").open = false;
            onExport("xlsx");
          }}
        >
          <FileSpreadsheet size={16} />
          Excel workbook<span>.xlsx</span>
        </button>
      </div>
    </details>
  );
}
function RecordEditor({ entity, record, onClose, onSaved }) {
  const feedback = useFeedback();
  const [form, setForm] = useState(() => {
      const obj = { ...defaults[entity], ...record };
      if (entity === "exams") {
        obj.startsAt = useLocalTime(obj.startsAt);
        obj.endsAt = useLocalTime(obj.endsAt);
      }
      return obj;
    }),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const { data: courses } = useData("/admin/courses"),
    { data: exams } = useData("/admin/exams"),
    { data: students } = useData("/admin/students");
  const c = config[entity];
  function set(key, value) {
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "examCode"
        ? {
            courseCode:
              exams?.records.find((e) => e.code === value)?.courseCode || "",
          }
        : {}),
    }));
  }
  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    const body = { ...form };
    delete body._id;

    if (entity === "exams") {
      body.startsAt = body.startsAt
        ? new Date(body.startsAt).toISOString()
        : null;
      body.endsAt = body.endsAt ? new Date(body.endsAt).toISOString() : null;
    }
    try {
      await api(`/admin/${entity}${record._id ? "/" + record._id : ""}`, {
        method: record._id ? "PUT" : "POST",
        body,
      });
      feedback({
        title:`${c.singular[0].toUpperCase() + c.singular.slice(1)} ${record._id ? "updated" : "created"}!`,
        eyebrow:"CHANGES SAVED",
        description:`${form.name || form.title || form.code} was ${record._id ? "updated" : "created"} successfully. Your ${c.title.toLowerCase()} list is up to date.`,
        buttonLabel:"Continue managing",
      });
      onSaved();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  const field = (
    key,
    label,
    {
      type = "text",
      required = true,
      full = false,
      hint,
      options,
      min,
      max,
    } = {},
  ) => (
    <label key={key} className={full ? "full" : ""}>
      {label}
      {!required && <span className="optional">Optional</span>}
      {options ? (
        <select
          required={required}
          value={form[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
        >
          {options.map((o) => (
            <option
              key={typeof o === "string" ? o : o.value}
              value={typeof o === "string" ? o : o.value}
            >
              {typeof o === "string" ? o : o.label}
            </option>
          ))}
        </select>
      ) : type === "textarea" ? (
        <textarea
          required={required}
          maxLength={key === "text" || key === "explanation" ? 5000 : 2000}
          rows={3}
          value={form[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
        />
      ) : (
        <input
          type={type}
          autoComplete={type === "password" ? "new-password" : "off"}
          required={required}
          min={min}
          max={max}
          minLength={type === "password" ? 12 : undefined}
          maxLength={type === "password" ? 128 : undefined}
          value={form[key] ?? ""}
          onChange={(e) => set(key, e.target.value)}
        />
      )}{" "}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  );
  const multi = (key, label, options) => (
    <div className="full multi-field">
      <label>{label}</label>
      <div className="multi-options">
        {options.length ? (
          options.map((o) => (
            <label key={o.value} className="check-option">
              <input
                type="checkbox"
                checked={form[key]?.includes(o.value) || false}
                onChange={(e) =>
                  set(
                    key,
                    e.target.checked
                      ? [...(form[key] || []), o.value]
                      : form[key].filter((x) => x !== o.value),
                  )
                }
              />
              <span>
                {o.label}
                <small>{o.value}</small>
              </span>
            </label>
          ))
        ) : (
          <span className="muted">No records available. Add them first.</span>
        )}
      </div>
    </div>
  );
  return (
    <Modal
      wide
      title={`${record._id ? "Edit" : "Add"} ${c.singular}`}
      onClose={() => !busy && onClose()}
    >
      <form onSubmit={submit}>
        <div className="modal-body">
          {error && <Notice>{error}</Notice>}
          <div className="form-grid">
            {entity === "students" ? (
              <>
                {field("name", "Full name")}
                {field("studentId", "Register number", {hint:"Used by the student to sign in. Preserve any leading zeros."})}
                {field("email", "Email address", { type: "email" })}
                {field("dateOfBirth", "Date of birth", {type:"date",min:"1900-01-01",max:[new Date().getFullYear(),String(new Date().getMonth()+1).padStart(2,"0"),String(new Date().getDate()).padStart(2,"0")].join("-"),hint:"Used for student sign-in. Changing this or the register number signs out the student’s existing sessions."})}
                {field("phone", "Phone number", {
                  required: false,
                  type: "tel",
                })}
                {field("department", "Department", { required: false })}
                {field("status", "Account status", {
                  options: ["active", "inactive"],
                })}
                {multi(
                  "courseCodes",
                  "Enrolled courses",
                  (courses?.records || []).map((c) => ({
                    value: c.code,
                    label: c.title,
                  })),
                )}
              </>
            ) : entity === "courses" ? (
              <>
                {field("code", "Course code")}
                {field("title", "Course title")}
                {field("instructor", "Instructor", { required: false })}
                {field("status", "Status", { options: ["active", "archived"] })}
                {field("description", "Description", {
                  type: "textarea",
                  required: false,
                  full: true,
                })}
              </>
            ) : entity === "exams" ? (
              <>
                {field("code", "Examination code")}
                {field("title", "Examination title")}
                {field("courseCode", "Course", {
                  options: [
                    { value: "", label: "Select a course" },
                    ...(courses?.records || []).map((c) => ({
                      value: c.code,
                      label: `${c.code} · ${c.title}`,
                    })),
                  ],
                })}
                {field("status", "Publication status", {
                  options: ["draft", "published", "archived"],
                  hint: "Add enough questions before publishing.",
                })}
                {field("durationMinutes", "Duration (minutes)", {
                  type: "number",
                  min: 1,
                  max: 240,
                })}
                {field("questionCount", "Questions per attempt", {
                  type: "number",
                  min: 1,
                  max: 200,
                })}
                {field("marksPerQuestion", "Marks per question", {
                  type: "number",
                  min: 1,
                  max: 100,
                })}
                {field("passPercentage", "Pass percentage", {
                  type: "number",
                  min: 0,
                  max: 100,
                })}
                {field("maxAttempts", "Maximum attempts", {
                  type: "number",
                  min: 1,
                  max: 10,
                })}
                <label className="toggle-field">
                  <input
                    type="checkbox"
                    checked={form.shuffleQuestions}
                    onChange={(e) => set("shuffleQuestions", e.target.checked)}
                  />
                  <span>
                    Shuffle questions
                    <small>A random selection from this exam’s bank.</small>
                  </span>
                </label>
                {field("startsAt", "Available from", {
                  type: "datetime-local",
                  required: false,
                  hint: "Times use your device’s local timezone.",
                })}
                {field("endsAt", "Closes at", {
                  type: "datetime-local",
                  required: false,
                })}
                <div className="info-callout full">
                  Students enrolled in the selected course receive this exam
                  automatically. You can assign additional students below.
                </div>
                {multi(
                  "assignedStudentEmails",
                  "Additional student assignments",
                  (students?.records || []).map((s) => ({
                    value: s.email,
                    label: s.name,
                  })),
                )}
              </>
            ) : (
              <>
                {field("code", "Question code")}
                {field("examCode", "Examination", {
                  options: [
                    { value: "", label: "Select an examination" },
                    ...(exams?.records || []).map((e) => ({
                      value: e.code,
                      label: `${e.code} · ${e.title}`,
                    })),
                  ],
                })}
                {field("courseCode", "Course code", {
                  hint: "Must match the selected examination.",
                })}
                {field("correctAnswer", "Correct answer", {
                  options: ["A", "B", "C", "D"],
                })}
                {field("text", "Question text", {
                  type: "textarea",
                  full: true,
                })}
                {field("optionA", "Option A")}
                {field("optionB", "Option B")}
                {field("optionC", "Option C")}
                {field("optionD", "Option D")}
                {field("explanation", "Answer explanation", {
                  type: "textarea",
                  full: true,
                  required: false,
                })}
              </>
            )}
          </div>
        </div>
        <div className="modal-footer">
          <button
            type="button"
            className="btn"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="btn primary" disabled={busy}>
            {busy
              ? "Saving…"
              : record._id
                ? "Save changes"
                : `Create ${c.singular}`}
            <CheckCircle2 size={16} />
          </button>
        </div>
      </form>
    </Modal>
  );
}
function ImportDialog({ entity, onClose, onImported }) {
  const toast = useToast();
  const feedback = useFeedback();
  const [file, setFile] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [report, setReport] = useState(null);
  async function template(format) {
    try {
      await download(`/admin/${entity}/template?format=${format}`);
    } catch (e) {
      toast(e.message, "error");
    }
  }
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const r = await api(`/admin/${entity}/import`, { method: "POST", body });
      setReport(r);
      onImported();
      feedback({
        title:r.failed?(r.created+r.updated>0?"Import completed with issues":"Import needs attention"):"Import complete!",
        eyebrow:"IMPORT REPORT",
        tone:r.failed?(r.created+r.updated>0?"warning":"error"):"success",
        description:r.failed?"Review the row errors in your import report and upload the corrected rows.":`All ${r.total} rows were imported successfully into ${config[entity].title.toLowerCase()}.`,
        stats:[{label:"Created",value:r.created},{label:"Updated",value:r.updated},{label:"Failed",value:r.failed}],
        buttonLabel:"View import report",
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal title={`Import ${entity}`} onClose={() => !busy && onClose()}>
      <form onSubmit={submit}>
        <div className="modal-body">
          {error && <Notice>{error}</Notice>}
          {report ? (
            <>
              <div className="report-grid">
                <div>
                  <strong>{report.created}</strong>
                  <span>Created</span>
                </div>
                <div>
                  <strong>{report.updated}</strong>
                  <span>Updated</span>
                </div>
                <div>
                  <strong>{report.failed}</strong>
                  <span>Failed</span>
                </div>
              </div>
              <Notice type={report.failed ? "error" : "success"}>
                {report.failed
                  ? "Valid rows were saved. Correct the errors below and reimport the failed rows."
                  : "All rows were imported successfully."}
              </Notice>
              {report.errors.length > 0 && (
                <div className="import-errors">
                  {report.errors.map((e) => (
                    <p key={e.row}>
                      <strong>Row {e.row}</strong>
                      {e.message}
                    </p>
                  ))}
                </div>
              )}
            </>
          ) : (
            <>
              <div className="template-box">
                <span className="stat-icon green">
                  <FileSpreadsheet size={23} />
                </span>
                <div>
                  <h3>Start with the right template</h3>
                  <p>Keep the column names. Replace the sample row.</p>
                  <div>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => template("csv")}
                    >
                      CSV template
                      <Download size={14} />
                    </button>
                    <button
                      type="button"
                      className="text-link"
                      onClick={() => template("xlsx")}
                    >
                      Excel template
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <label className="upload-zone">
                <Upload size={29} />
                <strong>{file ? file.name : "Choose your spreadsheet"}</strong>
                <span>CSV or XLSX · Up to 2 MB · 1,000 rows</span>
                <input
                  type="file"
                  accept=".csv,.xlsx"
                  required
                  onChange={(e) => setFile(e.target.files[0])}
                />
              </label>
              <div className="info-callout">
                Imports create records or update matches by{" "}
                {entity === "students"
                  ? "register number (studentId)"
                  : entity === "questions"
                    ? "exam code + question code"
                    : "code"}
                . Import courses first, then students, draft exams, and
                questions. Separate multiple course codes or emails with a
                semicolon (;).
              </div>
            </>
          )}
        </div>
        <div className="modal-footer">
          <button
            className="btn"
            type="button"
            disabled={busy}
            onClick={onClose}
          >
            {report ? "Done" : "Cancel"}
          </button>
          {report ? (
            <button
              type="button"
              className="btn primary"
              onClick={() => {
                setReport(null);
                setFile(null);
              }}
            >
              Import another file
            </button>
          ) : (
            <button className="btn primary" disabled={busy || !file}>
              {busy ? "Importing…" : "Import " + entity}
              <Upload size={16} />
            </button>
          )}
        </div>
      </form>
    </Modal>
  );
}
export function AdminResults() {
  const toast = useToast();
  const feedback = useFeedback();
  const { data, loading, error } = useData("/admin/results");
  const [search, setSearch] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [detail, setDetail] = useState(null);
  useEffect(() => setPage(1), [search, filter]);
  const all = data?.records || [],
    rows = all.filter(
      (r) =>
        (filter === "all" || (filter === "passed") === r.passed) &&
        [
          r.student?.name,
          r.student?.email,
          r.student?.studentId,
          r.examTitle,
          r.examCode,
          r.courseCode,
        ]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const average = all.length
    ? Math.round(all.reduce((sum, r) => sum + r.percentage, 0) / all.length)
    : 0;
  async function exportData(format) {
    try {
      await download(
        `/admin/results/export?format=${format}&search=${encodeURIComponent(search)}`,
      );
      feedback({title:"Results exported!",eyebrow:"DOWNLOAD COMPLETE",description:`Your results were exported as ${format.toUpperCase()}. Check your downloads for the file.`,buttonLabel:"Back to results"});
    } catch (e) {
      toast(e.message, "error");
    }
  }
  return (
    <>
      <PageHeading
        title="Results & reports"
        description="Every result tells a story. Follow progress and share the bigger picture."
      >
        <ExportMenu onExport={exportData} />
      </PageHeading>
      <div className="stats-grid three">
        <StatCard
          label="Completed attempts"
          value={all.length}
          icon={ClipboardList}
          note="All submitted examinations"
        />
        <StatCard
          label="Average score"
          value={`${average}%`}
          icon={TrendingUp}
          tone="blue"
          note="Across all completed attempts"
        />
        <StatCard
          label="Passed examinations"
          value={all.filter((r) => r.passed).length}
          icon={CheckCircle2}
          tone="green"
          note="A milestone worth celebrating"
        />
      </div>
      <section className="panel records-panel">
        <div className="records-toolbar">
          <div className="section-title">
            <h3>Examination results</h3>
            <span className="count-chip">{rows.length}</span>
          </div>
          <div className="table-controls">
            <SearchBox
              value={search}
              onChange={setSearch}
              placeholder="Search student, course, or exam…"
            />
            <select
              aria-label="Filter results"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All outcomes</option>
              <option value="passed">Passed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
        {loading ? (
          <Loading />
        ) : error ? (
          <ErrorState error={error} />
        ) : !rows.length ? (
          <Empty
            title="No results to show"
            text="Completed attempts will appear here. Try clearing any filters."
          />
        ) : (
          <>
            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>STUDENT</th>
                    <th>EXAMINATION</th>
                    <th>SCORE</th>
                    <th>PERCENTAGE</th>
                    <th>OUTCOME</th>
                    <th>COMPLETED</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.slice((page - 1) * 8, page * 8).map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="person-cell">
                          <Avatar name={r.student?.name} />
                          <div>
                            <strong>{r.student?.name || "Student"}</strong>
                            <span>{r.student?.studentId}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong>{r.examTitle}</strong>
                        <small>
                          {r.courseCode} · Attempt {r.attemptNumber}
                        </small>
                      </td>
                      <td>
                        <strong>{r.score}</strong>{" "}
                        <span className="muted">/ {r.maxScore}</span>
                      </td>
                      <td>
                        <div className="score-cell">
                          <span>{r.percentage}%</span>
                          <div className="mini-progress">
                            <i
                              style={{
                                width: `${r.percentage}%`,
                                background: r.passed ? "#12386b" : "#94a3b8",
                              }}
                            />
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge value={r.passed ? "passed" : "failed"} />
                      </td>
                      <td>{fmtDate(r.submittedAt)}</td>
                      <td>
                        <button
                          className="icon-btn"
                          aria-label={`View result for ${r.student?.name}`}
                          onClick={() => setDetail(r)}
                        >
                          <ArrowUpRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} setPage={setPage} total={rows.length} />
          </>
        )}
      </section>
      <div className="import-hint">
        <FileSpreadsheet size={18} />
        <span>
          Export CSV or Excel to share results. Downloads include all attempts
          matching the search text; the outcome filter applies to this table
          only.
        </span>
      </div>
      {detail && (
        <Modal title="Examination result" onClose={() => setDetail(null)}>
          <div className="modal-body">
            <div className="result-detail-top">
              <Avatar name={detail.student?.name} />
              <div>
                <h3>{detail.student?.name}</h3>
                <p>{detail.student?.email}</p>
              </div>
              <Badge value={detail.passed ? "passed" : "failed"} />
            </div>
            <h3>{detail.examTitle}</h3>
            <div className="result-big">
              {detail.percentage}
              <span>%</span>
            </div>
            <div className="detail-grid">
              {[
                ["Marks", `${detail.score} / ${detail.maxScore}`],
                ["Correct answers", detail.correctCount],
                ["Pass requirement", `${detail.passPercentage}%`],
                ["Attempt", detail.attemptNumber],
                ["Started", fmtDateTime(detail.startedAt)],
                ["Submitted", fmtDateTime(detail.submittedAt)],
              ].map(([k, v]) => (
                <div key={k}>
                  <span>{k}</span>
                  <strong>{v}</strong>
                </div>
              ))}
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn primary" onClick={() => setDetail(null)}>
              Close result
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}
