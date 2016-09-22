DROP TABLE IF EXISTS students;

CREATE TABLE students (
    username PRIMARY KEY,
    permission INTEGER,
    age INTEGER CHECK ((age>15 AND age<100) OR age=NULL),
    gender TEXT CHECK (gender='m' OR gender='f' OR gender=NULL),
    native_country TEXT
);

DROP TABLE IF EXISTS departments;
CREATE TABLE departments (
    dept_code TEXT PRIMARY KEY,
    dept_name TEXT
);

DROP TABLE IF EXISTS courses;
CREATE TABLE courses (
    course_id INTEGER PRIMARY KEY,
    dept_code TEXT,
    course_number INTEGER,
    course_name TEXT
);

DROP TABLE IF EXISTS course_editions;
CREATE TABLE course_editions (
    edition_id INTEGER PRIMARY KEY,
    course_id INTEGER REFERENCES courses (course_id),
    semester TEXT CHECK (semester IN ('f','w','s')),
    year INTEGER,
    total_students INTEGER,
    time_day TEXT CHECK (time_day IN ('m','a','e'))    
);

DROP TABLE IF EXISTS topics;
CREATE TABLE topics (
    topic_id INTEGER PRIMARY KEY,
    topic TEXT UNIQUE NOT NULL
);

DROP TABLE IF EXISTS skills;
CREATE TABLE skills (
    skill_id INTEGER PRIMARY KEY,
    skill TEXT UNIQUE NOT NULL
);

DROP TABLE IF EXISTS course_topics;
CREATE TABLE course_topics (
    topic_id INTEGER REFERENCES topics(topic_id),
    course_id INTEGER REFERENCES courses (course_id),
    PRIMARY KEY (topic_id, course_id)
);

DROP TABLE IF EXISTS course_skills;
CREATE TABLE course_skills (
    skill_id INTEGER REFERENCES skills(skill_id),
    course_id INTEGER REFERENCES courses (course_id),
    PRIMARY KEY (skill_id, course_id)
);

DROP TABLE IF EXISTS letter_grades;
CREATE TABLE letter_grades (
    letter_grade TEXT PRIMARY KEY,
    min_grade INTEGER,
    max_grade INTEGER,
    gpv REAL
);

DROP TABLE IF EXISTS enrollments;
CREATE TABLE enrollments (
    edition_id INTEGER REFERENCES course_editions (edition_id),
    username TEXT REFERENCES students (username),
    letter_grade TEXT REFERENCES letter_grades (letter_grade),
    course_ranking INTEGER CHECK ((course_ranking >= 1 AND course_ranking <=5) OR course_ranking = NULL),
    instr_ranking INTEGER CHECK ((instr_ranking >= 1 AND instr_ranking <=5) OR instr_ranking = NULL),
    PRIMARY KEY (username, edition_id)
);

DROP TABLE IF EXISTS skill_rankings;
CREATE TABLE skill_rankings (
    course_id INTEGER,
    edition_id INTEGER,
    username TEXT,
    skill_id INTEGER,
    rank_before INTEGER,
    rank_after INTEGER,
    PRIMARY KEY (username, edition_id, skill_id),
    FOREIGN KEY (username, edition_id) REFERENCES enrollments(username, edition_id),
    FOREIGN KEY (course_id, skill_id) REFERENCES course_skills(course_id, skill_id)
);

DROP TABLE IF EXISTS topic_interests;
CREATE TABLE topic_interests (
    course_id INTEGER,
    edition_id INTEGER,
    username TEXT,
    topic_id INTEGER,
    interest_before INTEGER,
    interest_after INTEGER,
    PRIMARY KEY (username, edition_id, topic_id),
    FOREIGN KEY (username, edition_id) REFERENCES enrollments(username, edition_id),
    FOREIGN KEY (course_id, topic_id) REFERENCES course_topics(course_id, topic_id)
);



