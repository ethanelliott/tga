var express = require('express');
var crypto = require('crypto');
var mongo = require('mongodb');
var session = require('client-sessions');
var numeral = require('numeral');
var schedule = require('node-schedule');
var getJSON = require('get-json');

var router = express.Router();

var menuItems = [
  {
    name:"Search",
    url:"/search"
  },
  {
    name:"Dashboard",
    url:"/dashboard"
  },
  {
    name:"Watch",
    url:"/watch"
  },
  {
    name:"Settings",
    url:"/settings"
  }
];

var adminMenuItems = [
  {
    name:"Search",
    url:"/search"
  },
  {
    name:"Dashboard",
    url:"/dashboard"
  },
  {
    name:"Watch",
    url:"/watch"
  },
  {
    name:"Settings",
    url:"/settings"
  },
  {
    name:"Admin",
    url:"/admin"
  }
];

var adminFunctions = [
  {
    name:"New User",
    img:"/images/admin-icons/adduser.png",
    url:"/admin/adduser"
  },
  {
    name:"UserList",
    img:"/images/admin-icons/user.png",
    url:"/admin/userlist"
  },
  {
    name:"View Team List",
    img:"/images/admin-icons/list.png",
    url:"/teamlist"
  },
  {
    name:"Update Team List",
    img:"/images/admin-icons/update.png",
    url:"/admin/getTeamList"
  }
];

/* GET home page. */
router.get('/', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            res.render('index', { title: 'Home', menu:adminMenuItems, user:req.session.user, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
          }else{
            res.render('index', { title: 'Home', menu:menuItems, user:req.session.user, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
          }
        }else {
          res.render('start', { title: 'Start'});
        }
      });
    }
    else {
      res.render('start', { title: 'Start'});
    }
});

router.get('/search', function(req, res, next) {
  var q = parseInt(req.query.q);
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var dbdata = req.dbData;
          var col = dbdata.get('teamlist');
          var searchFor = {"team_number": q };
          if (value[0].admin === true){
            col.find(searchFor).then(
              function(x){
                res.render('search', { title: 'Search', menu:adminMenuItems, user:req.session.user, results:x, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
              });
          }else{
            col.find(searchFor).then(
              function(x){
                res.render('search', { title: 'Search', menu:menuItems, user:req.session.user, results:x, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
              });
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/dashboard', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var baseurl = "https://www.thebluealliance.com/api/v2/";
          var requestpart = "events/2017";
          var requestHeader = "?X-TBA-App-Id=EthanE:datascraper:v01";
          var url = baseurl + requestpart + requestHeader;
          getJSON(url, function(error, eventData){
            var districtrequestpart = "districts/2017";
            var durl = baseurl + districtrequestpart + requestHeader;
            getJSON(durl, function(error, districtData){
              var eventlist = [];
              for(i = 0; i < eventData.length; i++)
              {
                if (eventData[i].event_type === 0)
                {
                  eventlist.push(eventData[i]);
                }
              }
              for(i = 0; i < districtData.length; i++)
              {
                districtData[i].name = districtData[i].name + " District";
                districtData[i].type = 1;
                eventlist.push(districtData[i]);
              }
              if (value[0].admin === true){
                res.render('dashboard', { title: 'Dashboard', menu:adminMenuItems, user:req.session.user, events:eventlist, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
              }else{
                res.render('dashboard', { title: 'Dashboard', menu:menuItems, user:req.session.user, events:eventlist, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
              }
            });
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/dashboard/:eventID/:teamID', function(req, res, next) {
  var evid = req.params.eventID;
  var tmid = req.params.teamID;
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var baseurl = "https://www.thebluealliance.com/api/v2/";
          var eventrequestpart = "event/" + evid;
          var matchrequestpart = "event/" + evid + "/matches";
          var teamrequestpart = "team/" + tmid;
          var requestHeader = "?X-TBA-App-Id=EthanE:datascraper:v01";
          var eventurl = baseurl + eventrequestpart + requestHeader;
          var matchurl = baseurl + matchrequestpart + requestHeader;
          var teamurl = baseurl + teamrequestpart + requestHeader;
          getJSON(eventurl, function(error, eventData){
            getJSON(matchurl, function(error, matchData){
              getJSON(teamurl, function(error, teamData){
                var ptitle = eventData.short_name + " " + eventData.event_type_string + " | " + teamData.team_number;
                if (value[0].admin === true){
                  res.render('dashboardview', { title: ptitle, user:req.session.user, menu:adminMenuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
                }else{
                  res.render('dashboardview', { title: ptitle, user:req.session.user, menu:menuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
                }
              });
            });
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/settings', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            res.render('settings', { title: 'Settings',user:req.session.user, menu:adminMenuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
          }else{
            res.render('settings', { title: 'Settings', user:req.session.user, menu:menuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/watch', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var url = "https://api.twitch.tv/kraken/streams/firstinspires?client_id=ujbba01698zw37mgqxfbla0kyoe4j2";
          getJSON(url, function(error, data){
            var kickofflive = false;
            if (data.stream !== null)
            {
              kickofflive = true;
            }
            var vidList = [
              {
                name:"Kickoff Broadcast",
                type:"twitch",
                id:"firstinspires",
                url:"/watch/kickoff"
              },
              {
                name:"RI3D Broadcast",
                type:"twitch",
                id:"firstupdatesnow",
                url:"/watch/ri3d"
              }
            ];
            if (value[0].admin === true){
              res.render('video', { title: 'Videos',user:req.session.user, menu:adminMenuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards, videolist:vidList});
            }else{
              res.render('video', { title: 'Videos', user:req.session.user, menu:menuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards, videolist:vidList});
            }
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/watch/:eventid', function(req, res, next) {
  var evid = req.params.eventid;
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var vidSrc = "";
          var vidType = "";
          var vidName = "";
          if (evid === "kickoff")
          {
            vidSrc = "https://player.twitch.tv/?channel=firstinspires";
            vidType = "iframe";
            vidName = "Kickoff Broadcast";
          }
          else if (evid === "ri3d")
          {
            vidSrc = "https://player.twitch.tv/?channel=firstupdatesnow";
            vidType = "iframe";
            vidName = "RI3D Broadcast";
          }
          else
          {

          }
          if (value[0].admin === true){
            res.render('videoview', { title: 'Video',user:req.session.user, menu:adminMenuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards, videotype: vidType, videosrc:vidSrc, videoname: vidName});
          }else{
            res.render('videoview', { title: 'Video', user:req.session.user, menu:menuItems, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards, videotype: vidType, videosrc:vidSrc, videoname: vidName});
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/admin', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.find({},{},function(e,users){
              res.render('admin', { title: 'Admin', menu:adminMenuItems, user:req.session.user, af:adminFunctions, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/admin/userlist', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.find({},{},function(e,users){
              res.render('userlist', { title: 'User List', menu:adminMenuItems, user:req.session.user, userlist:users, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/admin/getTeamList', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            var dbdata = req.dbData;
          	var col = dbdata.get('teamlist');
            col.remove({}).then(function(){
              res.redirect('/admin/getTeamList/0');
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/admin/getTeamList/:tbaPage', function(req, res, next) {
  var tbap = parseInt(req.params.tbaPage);
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            var dbdata = req.dbData;
          	var col = dbdata.get('teamlist');
            getTeamData(tbap, function(data){
              col.insert(data, function (err, doc) {
                if (err) {
                  res.send("There was a problem adding the information to the database.");
                }
                else {
                  if (tbap === 13)
                  {
                    col.remove({"rookie_year":null}).then(function(){
                      res.redirect('/admin');
                    });
                  } else {
                    var nextPage = tbap + 1;
                    console.log(tbap + " -> " + nextPage);
                    res.redirect('/admin/getTeamList/' + nextPage);
                  }
                }
              });
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

function getTeamData(page, callback)
{
  var url = "https://www.thebluealliance.com/api/v2/teams/" + page + "?X-TBA-App-Id=EthanE:datascraper:v01";
  getJSON(url, function(error, data){
    callback(data);
  });
}

router.get('/admin/adduser', function(req, res, next) {
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.find({},{},function(e,users){
              res.render('adduser', { title: 'Add User', menu:adminMenuItems, user:req.session.user, userlist:users, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/teamlist/', function(req, res) {
  var dbdata = req.dbData;
  var col = dbdata.get('teamlist');
  var db = req.dbUser;
	var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            col.find({},{},function(e,teams){
              res.render('teamlist', { title: 'Team List', menu:adminMenuItems, user:req.session.user, teamlist:teams, af:adminFunctions, faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
            });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/fave/add/team/:teamid',function(req, res){
  var db = req.dbUser;
  var collection = db.get('user');
  var teamID = req.params.teamid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.update(
              {_id:value[0]._id},
              {$addToSet:{faveteams:teamID}}
            ).then(function(){
              collection.find({'username':req.session.user.username}).then(function(fund) {
                res.json({"status":"success"});
              });
            });
          }else{
            res.json({"status":"fail"});
          }
        }else {
          res.json({"status":"fail"});
        }
      });
    }
    else {
      res.json({"status":"fail"});
    }
});

router.get('/fave/remove/team/:teamid',function(req, res){
  var db = req.dbUser;
  var collection = db.get('user');
  var teamID = req.params.teamid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.update(
              {_id:value[0]._id},
              {$pull:{faveteams:teamID}}
            ).then(function(){
              collection.find({'username':req.session.user.username}).then(function(fund) {
                res.json({"status":"success"});
              });
            });
          }else{
            res.json({"status":"fail"});
          }
        }else {
          res.json({"status":"fail"});
        }
      });
    }
    else {
      res.json({"status":"fail"});
    }
});

router.get('/fave/add/event/:eventid',function(req, res){
  var db = req.dbUser;
  var collection = db.get('user');
  var eventID = req.params.eventid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          getEventData(eventID, function(ev){
            if (ev !== null)
            {
              if (value[0].admin === true){
                collection.update(
                  {_id:value[0]._id},
                  {$addToSet:{faveevents:{"key":eventID, "name":ev.short_name}}}
                ).then(function(){
                  collection.find({'username':req.session.user.username}).then(function(fund) {
                    res.json({"status":"success"});
                  });
                });
              }else{
                res.json({"status":"fail"});
              }
            }
            else
            {
              res.json({"status":"fail"});
            }
          });
        }else {
          res.json({"status":"fail"});
        }
      });
    }
    else {
      res.json({"status":"fail"});
    }
});

router.get('/fave/remove/event/:eventid',function(req, res){
  var db = req.dbUser;
  var collection = db.get('user');
  var eventID = req.params.eventid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          getEventData(eventID, function(ev){
            if (ev !== null)
            {
              if (value[0].admin === true){
                collection.update(
                  {_id:value[0]._id},
                  {$pull:{faveevents:{"key":eventID, "name":ev.short_name}}}
                ).then(function(){
                  collection.find({'username':req.session.user.username}).then(function(fund) {
                    res.json({"status":"success"});
                  });
                });
              }else{
                res.json({"status":"fail"});
              }
            }
            else
            {
              res.json({"status":"fail"});
            }
          });
        }else {
          res.json({"status":"fail"});
        }
      });
    }
    else {
      res.json({"status":"fail"});
    }
});

router.get('/team/:teamid', function(req, res) {
  var db = req.dbUser;
	var collection = db.get('user');
  var teamID = "frc" + req.params.teamid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var baseurl = "https://www.thebluealliance.com/api/v2/";
          var teamrequestpart = "team/" + teamID;
          var requestHeader = "?X-TBA-App-Id=EthanE:datascraper:v01";
          var teamurl = baseurl + teamrequestpart + requestHeader;
          getJSON(teamurl, function(error, teamdata){
            var eventsrequestpart = "team/" + teamID + "/2017/events";
            var eventsurl = baseurl + eventsrequestpart + requestHeader;
            getJSON(eventsurl, function(error, eventdata){
              var ptitle = "Team " + teamdata.team_number;
              var isFave = "nah";
              if (value[0].faveteams)
              {
                for(i = 0; i < value[0].faveteams.length; i++)
                {
                  if (value[0].faveteams[i] === teamdata.team_number.toString())
                  {
                    isFave = "yass";
                    break;
                  }
                }
              }
              if (value[0].admin === true){
                res.render('teaminfo', {
                  title: ptitle,
                  menu:adminMenuItems,
                  user:req.session.user,
                  team:teamdata,
                  events:eventdata,
                  isstar:isFave,
                  faveTeams:value[0].faveteams,
                  faveEvents:value[0].faveevents,
                  faveDashboards:value[0].favedashboards
                });
              }else{
                res.render('teaminfo', {
                  title: ptitle,
                  menu:menuItems,
                  user:req.session.user,
                  team:teamdata,
                  events:eventdata,
                  isstar:isFave,
                  faveTeams:value[0].faveteams,
                  faveEvents:value[0].faveevents,
                  faveDashboards:value[0].favedashboards
                });
              }
            });
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/event/:eventid', function(req, res) {
  var db = req.dbUser;
	var collection = db.get('user');
  var eventID = req.params.eventid;
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          var baseurl = "https://www.thebluealliance.com/api/v2/";
          var eventrequestpart = "event/" + eventID;
          var requestHeader = "?X-TBA-App-Id=EthanE:datascraper:v01";
          var eventurl = baseurl + eventrequestpart + requestHeader;
          getJSON(eventurl, function(error, eventdata){
            var ptitle = eventdata.short_name;
            var isFave = "nah";
            if (value[0].faveevents)
            {
              for(i = 0; i < value[0].faveevents.length; i++)
              {
                if (value[0].faveevents[i].key === eventdata.key)
                {
                  isFave = "yass";
                  break;
                }
              }
            }
            if (value[0].admin === true){
              res.render('eventinfo', {
                title: ptitle,
                menu:adminMenuItems,
                user:req.session.user,
                eventd:eventdata,
                isstar:isFave,
                faveTeams:value[0].faveteams,
                faveEvents:value[0].faveevents,
                faveDashboards:value[0].favedashboards
              });
            }else{
              res.render('eventinfo', {
                title: ptitle,
                menu:menuItems,
                user:req.session.user,
                eventd:eventdata,
                isstar:isFave,
                faveTeams:value[0].faveteams,
                faveEvents:value[0].faveevents,
                faveDashboards:value[0].favedashboards
              });
            }
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/login', function(req, res, next) {
  var db = req.dbUser;
  var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          res.redirect('/');
        }else {
          res.render('login', { title: 'Login'});
        }
      });
    }
    else {
      res.render('login', { title: 'Login'});
    }
});

router.get('/logout', function(req, res) {
  req.session.reset();
  res.redirect('/');
});

router.get('/register', function(req, res, next) {
  var db = req.dbUser;
  var collection = db.get('user');
  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          res.redirect('/');
        }else {
          res.render('register', { title: 'Register'});
        }
      });
    }
    else {
      res.render('register', { title: 'Register'});
    }
});

/*POST to check login*/
router.post('/GALOG', function(req, res)
{
	var db = req.dbUser;

	var uName = req.body.uusername;
	var uPass = req.body.upassword;

	var collection = db.get('user');

	var query = collection.find({'username':uName}).then(
		function(value)
		{
			if(value[0])
			{
				if (validatePassword(uPass, value[0].password))
				{
					req.session.user = value[0];
					req.session.user.password = "";
					res.redirect("/");
				}
				else
				{
					res.redirect("/login");
				}
			}
			else
			{
				res.redirect("/login");
			}

		}
	);
});

router.post('/validateusername', function(req, res)
{
  var db = req.dbUser;
  var collection = db.get('user');
	var userName = req.body.uusername;
	var query = collection.find({'username':userName}).then(
		function(value)
		{
      console.log(value);
			if(value[0])
			{
				res.json({ "valid": false, "message":"Username already taken!" });
			}
			else
			{
				res.json({ "valid": true, "message":"Good" });
			}
		}
	);
});

/* POST to Add User Service */
router.post('/GAREGISTER', function(req, res)
{
  var db = req.dbUser;
  var collection = db.get('user');
  var userFullName = req.body.uname;
  var userName = req.body.uusername;
  var userEmail = req.body.uemail;
	var userPassword = req.body.upassword;
	var userPasswordConfirm = req.body.upassword_confirmation;

	var Upass = saltAndHash(userPassword);
	collection.insert({
    "name":userFullName,
		"username" : userName,
		"email" : userEmail,
		"password": Upass,
    "admin":false,
    "faveteams":[],
    "faveevents":[],
    "favedashboards":[]
	}, function (err, doc) {
		if (err) {
			res.send("There was a problem adding the information to the database.");
		}
		else {
    if (req.session && req.session.user){
      var query = collection.find({'username':req.session.user.username}).then(
        function(value){
          if(value){
            if (value[0].admin === true){
              res.redirect("/admin/userlist");
            }else{
              res.redirect('/');
            }
          }else {
            res.redirect('/');
          }
        });
      }
      else {
        res.redirect('/');
      }
		}
	});
});

router.get('/admin/removeuser/:userid', function(req, res)
{
  var db = req.dbUser;
  var collection = db.get('user');
	var userID = req.params.userid;

  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            collection.remove({"_id": userID}).then(function()
          	{
          		res.redirect("/admin/userlist");
          	});
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.get('/admin/edituser/:userid', function(req, res)
{
  var db = req.dbUser;
  var collection = db.get('user');
	var userID = req.params.userid;

  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          if (value[0].admin === true){
            var query = collection.find({'_id':userID}).then(
              function(dat){
                res.render('edituser', { title: 'Edit User', menu:adminMenuItems, user:req.session.user, edituserdat:dat[0], faveTeams:value[0].faveteams, faveEvents:value[0].faveevents, faveDashboards:value[0].favedashboards});
              });
          }else{
            res.redirect('/');
          }
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

router.post('/admin/edituser/save/:userid', function(req, res)
{
  var db = req.dbUser;
  var collection = db.get('user');
	var userID = req.params.userid;

  var userFullName = req.body.uname;
  var userName = req.body.uusername;
  var userEmail = req.body.uemail;
  var userPassword = req.body.upassword;
  var userAdmin;
  if (req.body.uadmin === "true")
  {
    userAdmin = true;
  }
  else
  {
    userAdmin = false;
  }

  if (req.session && req.session.user){
    var query = collection.find({'username':req.session.user.username}).then(
      function(value){
        if(value){
          collection.find({'_id':userID}).then(function(user){
            var fTeams = [];
            var fEvents = [];
            var fDashboards = [];
            if (user[0].faveteams)
            {
              fTeams = user[0].faveteams;
            }
            if (user[0].faveevents)
            {
              fTeams = user[0].faveevents;
            }
            if (user[0].favedashboards)
            {
              fTeams = user[0].favedashboards;
            }
            collection.update({"_id":userID},
            {
              "_id":userID,
              "name":userFullName,
          		"username" : userName,
          		"email" : userEmail,
              "password": userPassword,
              "admin": userAdmin,
              "faveteams":fTeams,
              "faveevents":fEvents,
              "favedashboards":fDashboards
          	}, function (err, doc) {
          		if (err) {
          			res.send("There was a problem adding the information to the database.");
          		}
          		else {
                res.redirect('/admin/userlist');
              }
            });
          });
        }else {
          res.redirect('/');
        }
      });
    }
    else {
      res.redirect('/');
    }
});

var getEventData = function(eventID, callback)
{
  if (eventID)
  {
    var url = "https://www.thebluealliance.com/api/v2/event/" + eventID + "?X-TBA-App-Id=EthanE:datascraper:v01";
    getJSON(url, function(error, data){
      if (!error)
      {
        callback(data);
      }
      else
      {
        callback(null);
      }
    });
  }
}

var saltLength = 10;

var generateSalt = function()
{
	var set = '0123456789abcdefghijklmnopqurstuvwxyzABCDEFGHIJKLMNOPQURSTUVWXYZ';
	var salt = '';
	for (var i = 0; i < saltLength; i++) {
		var p = Math.floor(Math.random() * set.length);
		salt += set[p];
	}
	return salt;
};

var hash = function(str)
{
	return crypto.createHash('sha256').update(str).digest('HEX');
};

var saltAndHash = function(pass)
{
	//"If I salt a password does that make it spicy?"
	var salt = generateSalt();
	return salt + hash(pass + salt) + hash(salt);
};

var validatePassword = function(plainPass, hashedPass)
{
	var salt = hashedPass.substr(0, saltLength);
	var validHash = salt + hash(plainPass + salt) + hash(salt);
	if (hashedPass === validHash)
  {return true;}
	else
  {return false;}
};

module.exports = router;
