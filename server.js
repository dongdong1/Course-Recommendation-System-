var express = require('express');
var sqlite3 = require('sqlite3').verbose();
var path = require('path');
var nunjucks = require('nunjucks');
var bodyParser = require('body-parser');
var fs=require('fs');
var Handlebars = require('handlebars');
var session = require('express-session');


var db = new sqlite3.Database('CEA');
db.serialize();

var app = express();
nunjucks.configure('views', { autoescape: true, express: app });
app.use(bodyParser.urlencoded({ extended: false })); 
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'assets')));
//app.use(session({ secret: 'I am actually a potato', resave: false, saveUninitialized: false }));


var course_taken=[];
var user_skill={};
var user_topic={};
var skill_length;
var topic_length;
var active_user;

app.get('/', function (req, res) {
   course_taken=[];
   user_skill={};
   user_topic={};
   skill_length=0;
   topic_length=0;
   active_user='';
  res.render('index.html');
});

app.post('/login',function(req,res){
     var username=req.body.username;
     var permission;
     var age;
     var gender;
     var native_country;   
     var query='select permission,age,gender,native_country from students where username="'+
     username+'";'
     db.all(query,function(err,rows){
       if(err || rows.length==0)
        throw err;
        console.log(rows[0].permission,rows[0].native_country);
        permission=rows[0].permission;
        age=rows[0].age;
        gender=rows[0].gender;
        native_country=rows[0].native_country;
      
     db.run('drop table if exists userinfo_view;',function(err){
       if(err){
        throw err;
       }});

     db.run('create table userinfo_view('+
        ' name string,'+
        ' permission int,'+
        ' age int,'+
        ' gender string,'+
        ' country string'+
       ');',function(err){
       if(err){
        throw err;
       }}); 
     query='insert into userinfo_view values("'+username +'",'+permission+','
                +age+',"'+gender+'","'+native_country+'");';
     active_user=username;
     db.run(query,function(err){
       if(err){
        throw err;
       }});    

     db.run('drop view if exists skill_list;',function(err){
       if(err){
        throw err;
       }}); 
     });
     query='select distinct courses.course_id id,courses.dept_code course_dept,'+
     'courses.course_number course_num from courses,enrollments,course_editions'+
     ' where enrollments.edition_id=course_editions.edition_id and'+
     ' course_editions.course_id=courses.course_id and enrollments.username="'+
     username+'";'
     db.all(query,function(err,rows){
       if(err || rows.length==0){
        throw err;
       }
       else console.log('Login success!');
       var page_contents=render_page(rows,'./views/identify_course.html');
       for(var i=0;i<rows.length;i++){course_taken.push(rows[i].id);}
       console.log('id of courses taken:'+course_taken);
       res.end(page_contents);
     });
     
});

app.post('/check_username',function(req,res){
    var username=req.body.username;
    query='select * from students where username="'+username+'";';
    db.all(query,function(err,rows){
      if(err){
        throw err;
      }
      var check_result={};
      check_result.result=rows.length;
      res.send(check_result);
    });
});

app.post('/newuser',function(req,res){
     var username=req.body.username;
     var permission=req.body.permission;
     var age =req.body.age;
     var gender=req.body.gender;
     var native_country=req.body.native_country;
     var query='insert into students values("'+username +'",'+permission+','
                +age+',"'+gender+'","'+native_country+'");';

     db.run(query,function(err){
       if(err){
        throw err;
       }
       else console.log('Create new user'+username);
      
      db.run('drop table if exists userinfo_view',function(err){
       if(err){
        throw err;
       }});

     db.run('create table userinfo_view('+
        ' name string,'+
        ' permission int,'+
        ' age int,'+
        ' gender string,'+
        ' country string'+
       ');',function(err){
       if(err){
        throw err;
       }}); 
     
     query='insert into userinfo_view values("'+username +'",'+permission+','
                +age+',"'+gender+'","'+native_country+'");';
     active_user=username;
     db.run(query,function(err){
       if(err){
        throw err;
       }}); 

      query='select course_id,dept_code course_dept,course_number course_num from courses order by course_id;'
      db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        var page_contents=render_page(rows,'./views/collecting_course.html');
        res.end(page_contents);
      });

    /*   var page_contents=render_page(rows,'./views/collecting_course.html');
       console.log(rows);
       res.end(page_contents);*/
     });
     
});

app.post('/collect',function(req,res){
    course_taken=JSON.parse(req.body.course_taken);
    console.log(course_taken);
    res.send(req.body);   
});

app.get('/topic_interest', function (req, res) {
   db.run('drop view if exists topic_list;',function(err){
       if(err){
        throw err;
       }});  
   var query='create view topic_list as select departments.dept_name dept_name,'+
   'topics.topic_id topic_id,topic '+
   'from courses, course_topics, departments, topics '+
   'where course_topics.course_id=courses.course_id and '+ 
   'course_topics.topic_id=topics.topic_id and departments.dept_code=courses.dept_code '+
   'order by departments.dept_code;'
    db.run(query,function(err){
       if(err){
        throw err;
       }});  
   query='select count(*) topic_length from topics;'
   db.all(query,function(err,rows){
    if(err)
      throw err;
    topic_length=rows[0].topic_length;
   });
   query='select distinct * from topic_list;'
   db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        var template_source = fs.readFileSync('./views/topic_skill.html', 'utf8');
        var template = Handlebars.compile(template_source);
        var page_contents=template({packages:rows,method1:'initial',method2:'none'});
        res.end(page_contents);
      });
});

app.post('/topic_finish',function(req,res){
  user_topic=req.body;
     db.run('drop table if exists usertopic_view',function(err){
       if(err){
        throw err;
       }});

     db.run('create table usertopic_view('+
        ' topic int,'+
        ' ib int'+
       ');',function(err){
       if(err){
        throw err;
       }}); 
     console.log(user_topic);
  

  for(var i=0;i<topic_length;i++){
    if(user_topic['t'+i]!=undefined){

     
     query='insert into usertopic_view values('+i+','+user_topic['t'+i]+');';
     db.run(query,function(err){
       if(err){
        throw err;
       }}); 
    } 
  }
  
  query='insert into usertopic_view select topic_id,interest_before from topic_interests where username="'+active_user+
  '" and topic_id not in (select topic from usertopic_view);'; 
  db.run(query,function(err){
    if(err){
      throw err;
    }
  });

  db.run('drop view if exists skill_list;',function(err){
       if(err){
        throw err;
       }});  
   var query='create view skill_list as select departments.dept_name dept_name,'+
   'skills.skill_id skill_id,skills.skill skill '+
   'from courses, course_skills, departments, skills '+
   'where course_skills.course_id=courses.course_id and '+ 
   'course_skills.skill_id=skills.skill_id and departments.dept_code=courses.dept_code '+
   'order by departments.dept_code;'
    db.run(query,function(err){
       if(err){
        throw err;
       }});  
   query='select count(*) skill_length from skills;'
   db.all(query,function(err,rows){
    if(err)
      throw err;
    skill_length=rows[0].skill_length;
   });
   query='select distinct * from skill_list;'
   db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        var template_source = fs.readFileSync('./views/topic_skill.html', 'utf8');
        var template = Handlebars.compile(template_source);
        var page_contents=template({packages:rows,method1:'none',method2:'initial'});
        res.end(page_contents);
      });
});

app.post('/skill_finish',function(req,res){
  user_skill=req.body;
     db.run('drop table if exists userskill_view',function(err){
       if(err){
        throw err;
       }});

     db.run('create table userskill_view('+
        ' skill int,'+
        ' rb int'+
       ');',function(err){
       if(err){
        throw err;
       }}); 
     console.log(user_skill);
  for(var i=0;i<skill_length;i++){
    if(user_skill['s'+i]!=undefined){

     
  query='insert into userskill_view values('+i+','+user_skill['s'+i]+');';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 
    
    }
  }

  query='insert into userskill_view select skill_id,rank_before from skill_rankings where username="'+active_user+
  '" and skill_id not in (select skill from userskill_view);'; 
  db.run(query,function(err){
    if(err){
      throw err;
    }
  });

  query='drop view if exists skill_match;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='create view skill_match as '+
    'select rb, username, skill_id, rank_before '+
    'from userskill_view inner join skill_rankings '+ 
    'on userskill_view.skill=skill_rankings.skill_id;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='drop view if exists skill_distance_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view skill_distance_view as '+
    'select distinct userskill_view.skill as skill, userskill_view.rb as user_rb, skill_rankings.username as std, '+ 
    '(case when userskill_view.skill=skill_match.skill_id and skill_rankings.username=skill_match.username '+
    'then skill_match.rank_before else (5+userskill_view.rb) end) std_rb '+
    'from userskill_view left outer join skill_rankings left outer join skill_match '+
    'on userskill_view.skill=skill_match.skill_id and skill_rankings.username=skill_match.username '+
    'order by userskill_view.skill;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='drop view if exists topic_match;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='create view topic_match as '+
    'select ib, username, topic_id, interest_before '+
    'from usertopic_view inner join topic_interests '+ 
    'on usertopic_view.topic=topic_interests.topic_id;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='drop view if exists topic_distance_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view topic_distance_view as '+
    'select distinct usertopic_view.topic as topic, usertopic_view.ib as user_ib, topic_interests.username as std, '+ 
    '(case when usertopic_view.topic=topic_match.topic_id and topic_interests.username=topic_match.username '+
    'then topic_match.interest_before else (5+usertopic_view.ib) end) std_ib '+
    'from usertopic_view left outer join topic_interests left outer join topic_match '+
    'on usertopic_view.topic=topic_match.topic_id and topic_interests.username=topic_match.username '+
    'order by usertopic_view.topic;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 

  query='drop view if exists all_15_nei;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

var avg_age;
query='select avg(age) avg_age from students where age is not null;'
   db.all(query,function(err,rows){
    if(err)
      throw err;
    avg_age=rows[0].avg_age;
   });
query='select cast(sum(case when gender="m" then 1 else 0 end) as float)/count(*) as prop_male from students;'
db.all(query,function(err,rows){
    if(err)
      throw err;
 var  prop_male=rows[0].prop_male;
   
query='create view all_15_nei as '+
'SELECT distinct students.username as all_neighbor_name, '+ 
'((students.permission - userinfo_view.permission)*(students.permission - userinfo_view.permission) '+
'+(case when students.age is not null then (students.age - userinfo_view.age)*(students.age - userinfo_view.age) else ('+avg_age+'-userinfo_view.age)*('+avg_age+'-userinfo_view.age) end) '+
'+ (select* from(select sum((skill_distance_view.std_rb - skill_distance_view.user_rb)*(skill_distance_view.std_rb '+
'- skill_distance_view.user_rb)) from skill_distance_view, userskill_view '+
'    where students.username=skill_distance_view.std and userskill_view.skill=skill_distance_view.skill)) '+
'+ (select * from(select sum((topic_distance_view.std_ib-topic_distance_view.user_ib)*(topic_distance_view.std_ib- '+
'  topic_distance_view.user_ib)) from topic_distance_view, usertopic_view '+
'    where students.username=topic_distance_view.std and usertopic_view.topic=topic_distance_view.topic)) '+
'+(CASE WHEN students.native_country=userinfo_view.country THEN 0 ELSE 1 END) '+
'+(CASE WHEN students.gender is null then (CASE WHEN userinfo_view.gender="m" then 1-'+prop_male+' ELSE '+prop_male+' END) ELSE (CASE WHEN students.gender=userinfo_view.gender THEN 0 ELSE 1 END) END) ) as distance '+
'FROM students,userinfo_view '+
'Where students.username in (select username from topic_interests) and students.username<>userinfo_view.name '+
'ORDER BY 2;';
  db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  });

query='drop view if exists match_skill_interest_students';
db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  

query='create view match_skill_interest_students as '+
'select distinct students.username '+
'from students, skill_rankings, topic_interests '+
'where students.username=skill_rankings.username and skill_rankings.skill_id in (select skill from userskill_view) '+
'or students.username=topic_interests.username and topic_interests.topic_id in (select topic from usertopic_view)';
db.run(query,function(err){
       if(err){
        throw err;
       }}); 


query='drop view if exists neighbors_view_all';
db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  

query='create view neighbors_view_all as '+
'select username as neighbor_name from match_skill_interest_students '+
'intersect '+
'select all_neighbor_name as neighbor_name from all_15_nei;'
db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  

query='drop view if exists neighbors_view';
db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  

query='create view neighbors_view as '+
'select all_neighbor_name as neighbor_name,distance from all_15_nei '+
'where all_neighbor_name in '+
'(select * from neighbors_view_all) '+
'order by 2 '+
'LIMIT 15';
db.run(query,function(err){
       if(err){
        throw err;
       }}); 
  


 query='drop view if exists nei_edi_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

query='create view nei_edi_view as '+
'select distinct enrollments.edition_id as neighbor_editionid '+
'from neighbors_view, enrollments, skill_rankings, topic_interests '+
'where neighbors_view.neighbor_name=enrollments.username '+
'and enrollments.edition_id=skill_rankings.edition_id and enrollments.username=skill_rankings.username '+
'and enrollments.edition_id=topic_interests.edition_id and enrollments.username=topic_interests.username '+
'and skill_rankings.rank_before is not null and skill_rankings.rank_after is not null '+
'and topic_interests.interest_before is not null and topic_interests.interest_after is not null '+
'and enrollments.course_ranking is not null;';
 db.run(query,function(err){
       if(err){
        throw err;
       }});
  
  query='drop table if exists usercourse;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  query='create table usercourse( '+
        'course_id int);';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  for(var i=0;i<course_taken.length;i++){
    query='insert into usercourse values('+course_taken[i]+');';
    db.run(query,function(err){
       if(err){
        throw err;
       }});
  }

  query='drop view if exists nei_course_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view nei_course_view as '+
    'select distinct course_id as neighbor_coursesid '+
    'from nei_edi_view, course_editions '+
    'where nei_edi_view.neighbor_editionid=course_editions.edition_id '+
    'except '+
    'select usercourse.course_id '+ 
    'from usercourse '+
    'order by course_editions.course_id ';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  query='drop view if exists grade_recommend_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view grade_recommend_view as '+
   'select distinct courses.dept_code dept, courses.course_number number, avg(max_grade) '+
   'from nei_course_view, course_editions, enrollments, letter_grades, courses '+
   'where nei_course_view.neighbor_coursesid=course_editions.course_id '+ 
   'and course_editions.edition_id=enrollments.edition_id '+
   'and enrollments.letter_grade=letter_grades.letter_grade '+
   'and enrollments.username in (select neighbor_name from neighbors_view) '+
   'and course_editions.course_id=courses.course_id '+
   'group by course_editions.course_id '+
   'order by avg(max_grade) desc '+
   'limit 5';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  query='drop view if exists happy_recommend_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view happy_recommend_view as '+
    'select distinct courses.dept_code dept, courses.course_number number, avg(course_ranking) '+
    'from nei_course_view, course_editions, enrollments, courses '+
    'where nei_course_view.neighbor_coursesid=course_editions.course_id '+
    'and course_editions.edition_id=enrollments.edition_id '+
    'and course_editions.course_id=courses.course_id '+
    'and enrollments.username in (select neighbor_name from neighbors_view) '+
    'group by course_editions.course_id '+
    'order by avg(course_ranking) desc '+
    'limit 5'; 
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  query='drop view if exists interest_recommend_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view interest_recommend_view as '+
   'select distinct courses.dept_code dept, courses.course_number number, avg(interest_after-interest_before) '+
   'from nei_course_view,topic_interests, courses '+
   'where nei_course_view.neighbor_coursesid=topic_interests.course_id '+
   'and nei_course_view.neighbor_coursesid=courses.course_id '+
   'and topic_interests.username in (select neighbor_name from neighbors_view) '+
   'and interest_after is not null and interest_before is not null '+
   'group by nei_course_view.neighbor_coursesid '+
   'order by avg(interest_after-interest_before) desc '+
   'limit 5';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
  query='drop view if exists skill_recommend_view;';
  db.run(query,function(err){
       if(err){
        throw err;
       }});

  query='create view skill_recommend_view as '+
   'select distinct courses.dept_code dept, courses.course_number number, avg(rank_after-rank_before) '+
   'from nei_course_view, skill_rankings, courses '+
   'where nei_course_view.neighbor_coursesid=skill_rankings.course_id '+
   'and nei_course_view.neighbor_coursesid=courses.course_id '+
   'and nei_course_view.neighbor_coursesid=courses.course_id '+
   'and skill_rankings.username in (select neighbor_name from neighbors_view) '+
   'group by nei_course_view.neighbor_coursesid '+
   'order by avg(rank_after-rank_before) desc '+
   'limit 5';
  db.run(query,function(err){
       if(err){
        throw err;
       }});
   res.render('recommendation.html');


});

app.get('/grade',function(req,res){
  var rec_course=[];
  query='select dept,number from grade_recommend_view';
  db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        for(var i=0;i<rows.length;i++){
          var per_course={};
          per_course["dept"]=rows[i].dept;
          per_course["number"]=rows[i].number;
          rec_course.push(per_course);
        }
        console.log(rec_course);
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(rec_course));
      });
});

app.get('/interest',function(req,res){
  var rec_course=[];
  query='select dept,number from interest_recommend_view';
  db.all(query,function(err,rows){
        if(err){
          throw err;
        }

        for(var i=0;i<rows.length;i++){
          var per_course={};
          per_course["dept"]=rows[i].dept;
          per_course["number"]=rows[i].number;
          rec_course.push(per_course);
        }
        console.log(rec_course);
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(rec_course));
      });
});

app.get('/skill',function(req,res){
  var rec_course=[];
  query='select dept,number from skill_recommend_view';
  db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        for(var i=0;i<rows.length;i++){
          var per_course={};
          per_course["dept"]=rows[i].dept;
          per_course["number"]=rows[i].number;
          rec_course.push(per_course);
        }
        console.log(rec_course);
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(rec_course));
      });
});

app.get('/happy',function(req,res){
  var rec_course=[];
  query='select dept,number from happy_recommend_view';
  db.all(query,function(err,rows){
        if(err){
          throw err;
        }
        for(var i=0;i<rows.length;i++){
          var per_course={};
          per_course["dept"]=rows[i].dept;
          per_course["number"]=rows[i].number;
          rec_course.push(per_course);
        }
        console.log(rec_course);
        res.writeHead(200,{'Content-Type':'application/json'});
        res.end(JSON.stringify(rec_course));
      });
});

app.get('/add_data',function(req,res){
  var query='select course_id,dept_code,course_number from courses where ';
  for(var i=0;i<course_taken.length;i++){
      query+='course_id='
      query+=course_taken[i];
      if(i!=course_taken.length-1)query+=' or ';
  }
  query+=';';

  db.all(query,function(err,rows){
        if(err){
          throw err;
        }
      console.log(rows);
      var page_contents=render_page(rows,'./views/add_data.html');
      res.end(page_contents);
      });

});

app.post('/rank_course',function(req,res){
   var course_id=req.body.course_id;
   var length=course_id.length;
   var grade=req.body.grade;
   var c_rank=req.body.c_rank;
   var ins_rank=req.body.ins_rank;
   var course_edition=[];
   console.log(req.body);
   console.log(length);
   if(!(course_id instanceof Array)){
    length=1;
    course_id=[course_id];
    grade=[grade];
    c_rank=[c_rank];
    ins_rank=[ins_rank];
   }
   console.log(grade);

    query='select course_id,edition_id from course_editions where ';
    for(var i=0;i<length;i++){
      query+='course_id='+course_id[i];
      if(i!=length-1)query+=' or ';
    }
    query+=';';
    console.log(query);
    db.all(query,function(err,rows){
        if(err){
          throw err;
        }
      course_edition=rows;
      console.log(course_edition);

      query='delete from enrollments where username="'+active_user+'";';
      console.log(query);
      db.run(query,function(err){
          if(err){
            throw err;
          }
        });

      for(var i=0;i<course_edition.length;i++){ 
        var j;
        for(var j=0;j<course_id.length;j++)
          if(course_edition[i].course_id==course_id[j]) index=j;
        query='insert into enrollments values('+course_edition[i].edition_id+',"'+active_user+'","'+
        grade[index]+'",'+c_rank[index]+','+ins_rank[index]+');'
        db.run(query,function(err){
          if(err){
            throw err;
          }
        });     
      }

      });
});

app.post('/new_topic',function(req,res){
    var topic_length;
    var query='select count(*) length from topics;'
    db.all(query,function(err,rows){
      if(err){
        throw err;
      }
      topic_length=rows[0].length;
      query='insert into topics values('+(topic_length+1)+',"'+req.body.topic_name+'");';
      db.run(query,function(err){
        if(err){
          throw err;
        }
      });
      query='insert into course_topics values('+(topic_length+1)+','+req.body.rele_course+');';
      db.run(query,function(err){
        if(err){
          throw err;
        }
      });
    });
    query='select edition_id from course_editions where course_id='+req.body.rele_course+';';
    db.all(query,function(err,rows){
      if(err){
        throw err;
      }
      var editions=rows;
      for(var i=0;i<editions.length;i++){
        query='insert into topic_interests values('+req.body.rele_course+','+editions[i].edition_id+
        ',"'+active_user+'",'+(topic_length+1)+','+req.body.interest_before+','+req.body.interest_after+
        ');';
        db.run(query,function(err){
        if(err){
          throw err;
        }
        });
      }
    });

});

app.post('/new_skill',function(req,res){
    var skill_length;
    var query='select count(*) length from skills;'
    db.all(query,function(err,rows){
      if(err){
        throw err;
      }
      skill_length=rows[0].length;
      query='insert into skills values('+(skill_length+1)+',"'+req.body.skill_name+'");';
      db.run(query,function(err){
        if(err){
          throw err;
        }
      });
      query='insert into course_skills values('+(skill_length+1)+','+req.body.rele_course+');';
      db.run(query,function(err){
        if(err){
          throw err;
        }
      });
    });
    query='select edition_id from course_editions where course_id='+req.body.rele_course+';';
    db.all(query,function(err,rows){
      if(err){
        throw err;
      }
      var editions=rows;
      for(var i=0;i<editions.length;i++){
        query='insert into skill_rankings values('+req.body.rele_course+','+editions[i].edition_id+
        ',"'+active_user+'",'+(skill_length+1)+','+req.body.rank_before+','+req.body.rank_after+
        ');';
        db.run(query,function(err){
        if(err){
          throw err;
        }
        });
      }
    });

});

function render_page(package,file) {
  var template_source = fs.readFileSync(file, 'utf8');
  var template = Handlebars.compile(template_source);
  return template({packages: package});
}

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});

