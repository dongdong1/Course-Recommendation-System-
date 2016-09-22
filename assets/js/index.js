      function tab(){
        $('#newuser').toggle();
        $('#login').toggle();
        if($('#tab').text()=='Existed User') $('#tab').text('New User');
        else $('#tab').text('Existed User');
      }

      function check_username(){
      	var username= $('#login input[name="username"]').val();
      	var data={};
      	var check_result=true;
      	data.username=username;
      	$.ajax({
            url:'/check_username',
            method:'post',
            data:data,
            async:false,
            dataType:"json",
            success:function(data){
              console.log(data);
              if(data.result==0){
              	alert('User does not exist in database!');
              	check_result=false;
              	
              }
            }
          });
        return check_result;
      }