function add_new_topic(){
           $('.new_topic').toggle();
           $('.new_skill').hide();
           $('.course_rank').hide();
      }
function add_new_skill(){
           $('.new_topic').hide();
           $('.new_skill').toggle();
           $('.course_rank').hide();
      }
function exit(){
        window.location.href='/';
      }
function course_rank(){
           $('.new_topic').hide();
           $('.new_skill').hide();
           $('.course_rank').toggle();
}

 function success(){
  alert('Your data has been successfully added to the database!');
}