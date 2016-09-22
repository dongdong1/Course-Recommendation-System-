/*------------active user info-----------------*/
drop table if exists userinfo_view;
create table userinfo_view(
    name string,
    permission int,
    age int,
    gender string,
    country string
    );
insert into userinfo_view values('Dong',1,23,'f','China');

drop table if exists userskill_view;
create table userskill_view(
    skill int,
    rb int/*ranking before*/
    );
insert into userskill_view values(1,3);
insert into userskill_view values(2,1);
insert into userskill_view values(3,2);
insert into userskill_view values(5,3);
insert into userskill_view values(8,3);
insert into userskill_view values(9,4);
insert into userskill_view values(12,3);
insert into userskill_view values(17,1);
insert into userskill_view values(15,3);
insert into userskill_view values(33,2);
insert into userskill_view values(55,3);
insert into userskill_view values(67,2);
insert into userskill_view values(83,4);
insert into userskill_view values(31,4);
insert into userskill_view values(28,4);
insert into userskill_view values(44,4);
insert into userskill_view values(48,4);
insert into userskill_view values(80,3);
insert into userskill_view values(22,1);

drop table if exists usertopic_view;
create table usertopic_view(
    topic int,
    ib int/*interest before*/
    );
insert into usertopic_view values(1,3);
insert into usertopic_view values(2,1);
insert into usertopic_view values(3,2);
insert into usertopic_view values(5,3);
insert into usertopic_view values(8,3);
insert into usertopic_view values(9,4);
insert into usertopic_view values(10,3);
insert into usertopic_view values(25,1);
insert into usertopic_view values(22,3);
insert into usertopic_view values(33,2);
insert into usertopic_view values(69,3);
insert into usertopic_view values(90,2);
insert into usertopic_view values(83,4);
insert into usertopic_view values(44,4);
insert into usertopic_view values(34,4);
insert into usertopic_view values(52,4);
insert into usertopic_view values(49,4);
insert into usertopic_view values(78,3);
insert into usertopic_view values(76,1);
insert into usertopic_view values(51,1);
insert into usertopic_view values(56,1);

/*-----------for whose age is null---------*/
drop table if exists average_age;
create table average_age(
 avg_age real
);

insert into average_age
    select avg(age) from students where age is not null;

update students 
    set age=(select * from average_age) where age is null;



/*----------------match or no match--------------------------*/
drop view if exists skill_match;
create view skill_match as
    select username, skill_id, rank_before
    from userskill_view inner join skill_rankings 
    on userskill_view.skill=skill_rankings.skill_id;

drop view if exists skill_distance_view;
create view skill_distance_view as
    select distinct userskill_view.skill as skill, userskill_view.rb as user_rb, skill_rankings.username as std, 
    (case when userskill_view.skill=skill_match.skill_id and skill_rankings.username=skill_match.username then skill_match.rank_before else (5+userskill_view.rb) end) std_rb
    
    from userskill_view left outer join skill_rankings left outer join skill_match
    on userskill_view.skill=skill_match.skill_id and skill_rankings.username=skill_match.username
    order by userskill_view.skill;
/*select * from skill_distance_view;*/

drop view if exists topic_match;
create view topic_match as
    select ib, username, topic_id, interest_before
    from usertopic_view inner join topic_interests
    on usertopic_view.topic=topic_interests.topic_id;

drop view if exists topic_distance_view;
create view topic_distance_view as
    select distinct usertopic_view.topic as topic, usertopic_view.ib as user_ib, topic_interests.username as std,
    (case when usertopic_view.topic=topic_match.topic and topic_interests.username=topic_match.username then topic_match.interest_before else (5+usertopic_view.ib) end ) std_ib

    from usertopic_view left outer join topic_interests left outer join topic_match
    on usertopic_view.topic=topic_match.topic and topic_interests.username=topic_match.username
    order by usertopic_view.topic;
/*select * from topic_distance_view;*/



/*--------------------15 neighbours-----------------------------*/
drop view if exists match_skill_interest_students;
create view match_skill_interest_students as 
select distinct students.username
from students, skill_rankings, topic_interests
where students.username=skill_rankings.username and skill_rankings.skill_id in (select skill from userskill_view)
or students.username=topic_interests.username and topic_interests.topic_id in (select topic from usertopic_view);




drop view if exists all_15_nei;
create view all_15_nei as 
SELECT distinct students.username as all_neighbor_name, 
((students.permission - userinfo_view.permission)*(students.permission - userinfo_view.permission) 
+(case when students.age is not null then (students.age - userinfo_view.age)*(students.age - userinfo_view.age) else (24.13-userinfo_view.age)*(24.13-userinfo_view.age) end) 
+ (select* from(select sum((skill_distance_view.std_rb - skill_distance_view.user_rb)*(skill_distance_view.std_rb 
- skill_distance_view.user_rb)) from skill_distance_view, userskill_view 
    where students.username=skill_distance_view.std and userskill_view.skill=skill_distance_view.skill)) 
+ (select * from(select sum((topic_distance_view.std_ib-topic_distance_view.user_ib)*(topic_distance_view.std_ib- 
  topic_distance_view.user_ib)) from topic_distance_view, usertopic_view 
    where students.username=topic_distance_view.std and usertopic_view.topic=topic_distance_view.topic)) 
+(CASE WHEN students.native_country=userinfo_view.country THEN 0 ELSE 1 END) 
+(CASE WHEN students.gender=userinfo_view.gender THEN 0 ELSE 1 END)) as distance 
FROM students,userinfo_view 
Where students.username in (select username from topic_interests) and students.username<>userinfo_view.name 
ORDER BY 2 
;



drop view if exists neighbors_view_all;
create view neighbors_view_all as
select username as neighbor_name from match_skill_interest_students
intersect
select all_neighbor_name as neighbor_name from all_15_nei;

drop view if exists neighbors_view;
create view neighbors_view as
select all_neighbor_name as neighbor_name,distance from all_15_nei
where all_neighbor_name in
(select * from neighbors_view_all)
order by 2
LIMIT 15;


/*---------------15 neighbours' editions----------------------------*/
drop view if exists nei_edi_view;
create view nei_edi_view as
select distinct enrollments.edition_id as neighbor_editionid
from neighbors_view, enrollments, skill_rankings, topic_interests
where neighbors_view.neighbor_name=enrollments.username
    and enrollments.edition_id=skill_rankings.edition_id and enrollments.username=skill_rankings.username 
    and enrollments.edition_id=topic_interests.edition_id and enrollments.username=topic_interests.username
;

/*---------------15 neighbours' courses----------------------------*/
drop view if exists nei_course_view;
create view nei_course_view as
    select distinct course_id as neighbor_coursesid
    from nei_edi_view, course_editions
    where nei_edi_view.neighbor_editionid=course_editions.edition_id
except 
select usercourse.course_id
from usercourse
order by course_editions.course_id;/*only here using the courses that the active user selected at the beginning*/ 


/*------------------------------------topic_list & skill_list---------------------------------*/


drop view if exists topic_list;
create view topic_list as
select departments.dept_name, topic
from courses, course_topics, departments, topics
where course_topics.course_id=courses.course_id and course_topics.topic_id=topics.topic_id and departments.dept_code=courses.dept_code
order by departments.dept_code;
/* want to list topic_name, thus using topics table */



drop view if exists skill_list;
create view skill_list as
select departments.dept_name, skill 
from courses, course_skills, departments, skills
where course_skills.course_id=courses.course_id and course_skills.skill_id=skills.skill_id and departments.dept_code=courses.dept_code
order by departments.dept_code;


/*-----------------------------------Recommendation------------------------------------------*/

/*
drop table if exists nei_course_view;
create table nei_course_view(
  neighbor_coursesid int  
);
insert into nei_course_view values(1);
insert into nei_course_view values(2);
insert into nei_course_view values(3);
insert into nei_course_view values(17);
insert into nei_course_view values(33);
insert into nei_course_view values(14);
insert into nei_course_view values(27);
insert into nei_course_view values(22);  
*/


drop view if exists grade_recommend_view;
create view grade_recommend_view as
select distinct course_editions.course_id, courses.course_name, avg(max_grade)
from nei_course_view, course_editions, enrollments, letter_grades, courses
where nei_course_view.neighbor_coursesid=course_editions.course_id 
and course_editions.edition_id=enrollments.edition_id 
and enrollments.letter_grade=letter_grades.letter_grade
and enrollments.username in (select neighbor_name from neighbors_view)
and nei_course_view.neighbor_coursesid=courses.course_id
group by course_editions.course_id
order by avg(max_grade) desc 
limit 5;


drop view if exists happy_recommend_view;
create view happy_recommend_view as
select distinct course_editions.course_id, courses.course_name, avg(course_ranking)
from nei_course_view, course_editions, enrollments, courses
where nei_course_view.neighbor_coursesid=course_editions.course_id
and course_editions.edition_id=enrollments.edition_id
and nei_course_view.neighbor_coursesid=courses.course_id
and enrollments.username in (select neighbor_name from neighbors_view)
group by course_editions.course_id
order by avg(course_ranking) desc
limit 5;


drop view if exists interest_recommend_view;
create view interest_recommend_view as
select distinct nei_course_view.neighbor_coursesid, courses.course_name, avg(interest_after-interest_before)
from nei_course_view,topic_interests, courses
where /*interest_before in (select ib from usertopic_view) and */ nei_course_view.neighbor_coursesid=topic_interests.course_id
and nei_course_view.neighbor_coursesid=courses.course_id
and topic_interests.username in (select neighbor_name from neighbors_view)
and interest_after is not null and interest_before is not null
group by nei_course_view.neighbor_coursesid
order by avg(interest_after-interest_before) desc
limit 5;

drop view if exists skill_recommend_view;
create view skill_recommend_view as
select distinct nei_course_view.neighbor_coursesid, courses.course_name, avg(rank_after-rank_before)
from nei_course_view, skill_rankings, courses
where /*rank_before in (select rb from userskill_view) and */ nei_course_view.neighbor_coursesid=skill_rankings.course_id
and nei_course_view.neighbor_coursesid=courses.course_id
and skill_rankings.username in (select neighbor_name from neighbors_view)
and rank_after is not null and rank_before is not null
group by nei_course_view.neighbor_coursesid
order by avg(rank_after-rank_before) desc
limit 5;

