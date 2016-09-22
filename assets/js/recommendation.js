function grade(){
  $.ajax({
            url:'/grade',
            method:'get',
            dataType:"json",
            success:function(data){
              $('.ask').hide();
              $('#grade').show();
              $('#interest').hide();
              $('#skill').hide();
              $('#happy').hide();
              console.log(data);
              var $rec_course='<ul>';
              for(var i=0;i<data.length;i++){
              	$rec_course+='<li>'+data[i].dept+data[i].number+'</li>';
              }
              $rec_course+='<ul>';
              $('.rec_course').html($rec_course);
            }
          });
}

function interest(){
  $.ajax({
            url:'/interest',
            method:'get',
            dataType:"json",
            success:function(data){
              $('.ask').hide();
              $('#grade').hide();
              $('#interest').show();
              $('#skill').hide();
              $('#happy').hide();
              console.log(data);
              var $rec_course='<ul>';
              for(var i=0;i<data.length;i++){
              	$rec_course+='<li>'+data[i].dept+data[i].number+'</li>';
              }
              $rec_course+='<ul>';
              $('.rec_course').html($rec_course);
            }
          });
}

function skill(){
  $.ajax({
            url:'/skill',
            method:'get',
            dataType:"json",
            success:function(data){
              $('.ask').hide();
              $('#grade').hide();
              $('#interest').hide();
              $('#skill').show();
              $('#happy').hide();
              console.log(data);
              var $rec_course='<ul>';
              for(var i=0;i<data.length;i++){
              	$rec_course+='<li>'+data[i].dept+data[i].number+'</li>';
              }
              $rec_course+='<ul>';
              $('.rec_course').html($rec_course);
            }
          });
}

function happy(){
  $.ajax({
            url:'/happy',
            method:'get',
            dataType:"json",
            success:function(data){
              $('.ask').hide();
              $('#grade').hide();
              $('#interest').hide();
              $('#skill').hide();
              $('#happy').show();
              console.log(data);
              var $rec_course='<ul>';
              for(var i=0;i<data.length;i++){
              	$rec_course+='<li>'+data[i].dept+data[i].number+'</li>';
              }
              $rec_course+='<ul>';
              $('.rec_course').html($rec_course);
            }
          });
}

function exit(){
   window.location.href='/';
}

function add_data(){
	window.location.href='/add_data';
}


