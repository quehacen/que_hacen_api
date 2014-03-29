var restify = require('restify');
var mongojs = require('mongojs');

var serverConfig = {
	'server' : 'localhost'
	, 'port' : process.env.PORT || 3002
	, 'mongoDB' : 'que_hacen' 
}

var apiServer = restify.createServer({
	"name" : "api.quehacenlosdiputados.net"
});

var db = mongojs( serverConfig.mongoDB );

apiServer
	.use(restify.fullResponse())
	.use(restify.bodyParser())
  .use(restify.queryParser())
  .use(headers)
  // Middleware limit request
  .use(limitParse)
  // Middleware sort request
	.use(sortParse)
  // Middleware only request
  .use(onlyParse)
  // Middleware not request
  .use(notParse)
  // Middleware query request
  .use(findParse);


/***** API *****/

apiServer.get('/diputados', function(req, res){

  	var collection = db.collection('diputados');
  	var noShow = { '_id' : 0 };

    if(!req.params.q) {
      req.params.q = {};
      req.params.q['activo'] = 1;
    }

    if( !req.params.order ) {
      req.params.order = {};
      req.params.order['normalized.apellidos'] = 1;
      req.params.order['normalized.nombre'] = 1;
    }

  	collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .sort( req.params.order )
      .limit ( req.params.limit )
      .toArray( function(err,docs){
    		if(err){ res.send(err); return;}
    		res.send(docs);
    	});
});

apiServer.get('/diputados/bienes', function(req, res){

    var collection = db.collection('bienes');
    var noShow = { '_id' : 0 };
    if( !req.params.order ) {
      req.params.order = {};
      req.params.order['tipo'] = 1;
    }

    collection
        .find(req.params.q, req.params.only || req.params.not || noShow)
        .sort( req.params.order )
        .limit ( req.params.limit )
        .toArray( function( err, docs){
          //res.send([docs, docs2]);
          res.send(docs);
        });
});

apiServer.get('/diputado/:id', function(req, res){

  	var collection = db.collection('diputados');
  	var noShow = { 
  		'_id' 				: 0
  	};

  	collection
      .findOne({ 'id' : parseInt(req.params.id) }, req.params.only || req.params.not || noShow, function( err, docs ){
		  if (err) { res.send(err); return; }
		  res.send(docs);
  	});
});

apiServer.get('/diputado/:id/votaciones', function(req, res){

    var collection = db.collection('diputados');
    var noShow = { 
      '_id'         : 0
    };

    collection
      .findOne( {'id': parseInt(req.params.id)} ,{ '_id':0, apellidos:1, nombre:1 }, function( err, docs ){

        if (err) { res.send(err); return; }
        
        var votaciones = db.collection('votacion');
        if( !req.params.order ) {
          req.params.order = {};
          req.params.order['fecha'] = -1;
        }

        if(!req.params.q) {
          req.params.q = {};
        }
        req.params.q['xml.resultado.votaciones.votacion'] = { $elemMatch: { 'diputado': docs.apellidos+', '+docs.nombre } };
        
        votaciones
          .find( req.params.q, req.params.only || req.params.not ||
            { '_id':0,
              'legislatura':1,
              'num':1,
              'numExpediente':1,
              'url':1,
              'fecha':1,
              'xml.resultado.informacion' : 1, 
              'xml.resultado.totales' : 1, 
              'xml.resultado.votaciones.votacion.$' : 1 
            }
          )
          .sort( req.params.order )
          .limit ( req.params.limit )
          .toArray( function( err2, docs2){
            //res.send([docs, docs2]);    
            res.send(docs2);    
          });
      });
});

apiServer.get('/diputado/:id/iniciativas', function(req, res){
  var collection = db.collection('diputados');
  var noShow = { 
    '_id'         : 0
  };
  collection
      .findOne( 
        {'id': parseInt(req.params.id)} ,
        { apellidos:1, nombre:1 }, 
        function( err, docs ){
          if (err) { res.send(err); return; }
  
          if( !req.params.order ){
            req.params.order = {};
            req.params.order['presentadoJS'] = -1;
          } 

          req.params.q['autores'] = { $in : [parseInt(req.params.id)] };
          req.params.q['tipo_autor'] = "Diputado";
          
          var iniciativas = db.collection('iniciativas');        
          iniciativas
            .find( req.params.q, req.params.only || req.params.not || noShow)
            .sort( req.params.order )
            .limit ( req.params.limit )
            .toArray( function( err2, docs2){
              //res.send([docs, docs2]);
              res.send(docs2);
            });
        }
      );
});

apiServer.get('/diputado/:id/bienes', function(req, res){
  var collection = db.collection('bienes');
  var noShow = { '_id' : 0 };
  if( !req.params.order ) {
    req.params.order = {};
    req.params.order['tipo'] = 1;
  }

  req.params.q['idDipu'] = parseInt(req.params.id);

  collection
      .find(req.params.q, req.params.only || req.params.not || noShow)
      .sort( req.params.order )
      .limit ( req.params.limit )
      .toArray( function( err, docs){
        //res.send([docs, docs2]);
        res.send(docs);
      });
});


apiServer.get('/grupos', function(req, res){

    var collection = db.collection('grupos');
    var noShow = { 
      '_id'         : 0
    };

    collection.find(req.params.q, req.params.only || req.params.not || noShow)
      .sort( req.params.order )
      .limit ( req.params.limit )
      .toArray( function(err,docs){
        if(err){ res.send(err); return;}
        res.send(docs);
      });
});

apiServer.get('/grupo/:id', function(req, res){

    var collection = db.collection('grupos');
    var noShow = { 
      '_id'         : 0
    };

    req.params.q['id']=parseInt(req.params.id);

    collection
      .findOne( req.params.q, req.params.only || req.params.not || noShow, function( err, docs ){
      if (err) { res.send(err); return; }
      res.send(docs);
    });
});

apiServer.get('/grupo/:id/diputados', function(req, res){

    var collection = db.collection('grupos');
    var noShow = { 
      '_id'         : 0
    };

    collection
      .findOne({ 'id' : parseInt(req.params.id) }, noShow, function( err, docs ){
        if (err) { res.send(err); return; }

        if( !req.params.order ) {
          req.params.order = {};
          req.params.order['normalized.apellidos'] = 1;
          req.params.order['normalized.nombre'] = 1;
        }

        req.params.q['activo'] = 1;
        req.params.q['grupo'] = docs.nombre;
        
        db.collection('diputados')
        .find( req.params.q, req.params.only || req.params.not || noShow)
        .sort( req.params.order )
        .limit ( req.params.limit )
        .toArray( function(err,docs2){
          if(err){ res.send(err); return;}
          res.send(docs2);
        });
    });
});

apiServer.get('/grupo/:id/iniciativas', function(req, res){

    var collection = db.collection('grupos');
    var noShow = { 
      '_id'         : 0
    };

    collection
      .findOne({ 'id' : parseInt(req.params.id) }, noShow, function( err, docs ){
      
      if (err) { res.send(err); return; }
      
      var iniciativas = db.collection('iniciativas');
      if( !req.params.order ){
        req.params.order = {};
        req.params.order['presentadoJS'] = -1;
      }

      req.params.q['autores'] = { $in : [parseInt(req.params.id)] };
      req.params.q['tipo_autor'] = "Grupo";

      iniciativas
        .find( req.params.q, req.params.only || req.params.not || noShow)
        .sort( req.params.order )
        .limit ( req.params.limit )
        .toArray( function( err2, docs2){
          //res.send([docs, docs2]);
          res.send(docs2);
        });
    });
});

apiServer.get('/formaciones', function(req, res){
  var collection = db.collection('formaciones');
  var noShow = { 
    '_id'         : 0
  };

  collection
    .find( req.params.q, req.params.only || req.params.not || noShow)
    .limit ( req.params.limit )
    .sort( req.params.order )
    .toArray( function(err,docs){
      if(err){ res.send(err); return; }
      res.send(docs);
    });
});

apiServer.get('/formacion/:id', function(req, res){
  var collection = db.collection('formaciones');
  var noShow = { 
    '_id'         : 0
  };

  req.params.q['id']=parseInt(req.params.id);

  collection
    .find( req.params.q, req.params.only || req.params.not || noShow)
    .limit ( req.params.limit )
    .sort( req.params.order )
    .toArray( function(err,docs){
      if(err){ res.send(err); return; }
      res.send(docs);
    });
});

apiServer.get('/votaciones', function(req, res){

    var collection = db.collection('votacion');
    var noShow = { 
      '_id'         : 0
    };

    if( !req.params.order ){
        req.params.order = {};
        req.params.order['fecha'] = -1;
    }

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .limit ( req.params.limit )
      .sort( req.params.order )
      .toArray( function(err,docs){
        if(err){ res.send(err); return; }
        res.send(docs);
      });
});

apiServer.get('/votacion/:session', function(req, res){

    var collection = db.collection('votacion');
    var noShow = { 
      '_id'         : 0
    };

    if( !req.params.order ){
        req.params.order = {};
        req.params.order['fecha'] = -1;
    }
    
    req.params.q['xml.resultado.informacion.sesion'] = req.params.session;

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .limit ( req.params.limit )
      .sort( req.params.order )
      .toArray( function(err,docs){
        if(err){ res.send(err); return; }
        res.send(docs);
      });
});

apiServer.get('/votacion/:session/:votacion', function(req, res){

    var collection = db.collection('votacion');
    var noShow = { 
      '_id'         : 0
    };

    if( !req.params.order ){
        req.params.order = {};
        req.params.order['fecha'] = -1;
    }
    
    req.params.q['xml.resultado.informacion.sesion'] = req.params.session;
    req.params.q['xml.resultado.informacion.numerovotacion'] = req.params.votacion;

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .limit ( req.params.limit )
      .sort( req.params.order )
      .toArray( function(err,docs){
        if(err){ res.send(err); return; }
        res.send(docs);
      });
});

apiServer.get('/iniciativas', function(req, res){

    var collection = db.collection('iniciativas');
    var noShow = { 
      '_id'         : 0
    };
    
    if( !req.params.order ){
        req.params.order = {};
        req.params.order['presentadoJS'] = -1;
    }

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .limit ( req.params.limit )
      .sort( req.params.order )
      .toArray(function(err,docs){
        if(err){ res.send(err); return;}
        res.send(docs);
      });
});

apiServer.get('/circunscripciones', function(req, res){

    var collection = db.collection('circunscripciones');
    var noShow = { 
      '_id'         : 0
    };

    if( !req.params.order ) {
      req.params.order = {};
      req.params.order['normalized.nombre'] = 1;
    }

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .limit( req.params.limit )
      .sort( req.params.order )
      .toArray( function(err,docs){
        if(err){ res.send(err); return; }
        res.send(docs);
      });
});

apiServer.get('/circunscripcion/:id', function(req, res){

    var collection = db.collection('circunscripciones');
    var noShow = { 
      '_id'         : 0
    };

    collection
      .findOne({ 'id' : parseInt(req.params.id) }, req.params.only || req.params.not || noShow, function( err, docs ){
      if (err) { res.send(err); return; }
      res.send(docs);
    });
});

apiServer.get('/circunscripcion/:id/diputados', function(req, res){

    var collection = db.collection('circunscripciones');
    var noShow = { 
      '_id'         : 0
    };

    collection
      .findOne({ 'id' : parseInt(req.params.id) }, noShow, function( err, docs ){
      if (err) { res.send(err); return; }

        if(!req.params.q) {
          req.params.q = {};
          req.params.q['activo'] = 1;
        }

        req.params.q['circunscripcion'] = docs.nombre;
        
        db.collection('diputados')
        .find( req.params.q, req.params.only || req.params.not || noShow)
        .sort( req.params.order )
        .limit ( req.params.limit )
        .toArray( function(err,docs2){
          if(err){ res.send(err); return;}
          res.send(docs2);
        });
    });
});

apiServer.get('/organos', function(req, res){

    var collection = db.collection('organos');
    var noShow = { '_id' : 0 };

    collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .sort( req.params.order )
      .limit ( req.params.limit )
      .toArray( function(err,docs2){
        if(err){ res.send(err); return;}
        res.send(docs2);
      });
});

apiServer.get('/eventos', function(req, res){

  var collection = db.collection('eventos');
  var noShow = { '_id' : 0 };

  if( !req.params.order ){
      req.params.order = {};
      req.params.order['fechahoraJS'] = -1;
  }

  collection
      .find( req.params.q, req.params.only || req.params.not || noShow)
      .sort( req.params.order )
      .limit ( req.params.limit )
      .toArray( function(err,docs){
        if(err){ res.send(err); return;}
        res.send(docs);
      });
});

apiServer.get('/', function(req, res){
	res.send( apiServer.name );
});

apiServer.get('/test', function(req, res){

  db.collection('eventos')
    .find({fechahoraJS:{$gte: new Date(Date.now()) }})
    //.find()
    .toArray( function(err,docs){
      if(err){ res.send(err); return;}
      res.send(docs);
    });

  /*db.collection('bienes').mapReduce( 
    function(){ 
      var output = { "diputadoID" : this._id }
      emit(this._id, output);
    },
    function(key, values) {
      return values;
    },
    {
      out : { inline : 1 }
    }, 
    function(err, resp){
      res.send(arguments);
    }
  );*/
/*
  var mapFn = function(){ 
    var output = { "diputadoID" : db.diputados.findOne({ id: this.idDipu }) }
    emit(this._id, output);
  }
  var reduceFn = function(key, values) {
    return values;
  }
  var MR = {
      mapreduce: "bienes", 
      out:  { inline : 1 },
      map: mapFn.toString(),
      reduce: reduceFn.toString()
  }

  db.runCommand(MR, function(err, dbres) {
      res.send(dbres);
  });
*/

});


/**** funtions ********/

function headers( req, res, next ){
	res.header("Access-Control-Allow-Origin", "*"); 
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  res.set('content-type', 'application/json; charset=utf-8');
  next();
}
// ?limit=10
function limitParse( req, res, next ){
  req.params.limit = parseInt( req.params.limit || 0 );
  next();
}

// ?order={"xml.resultado.totales.encontra":1}
function sortParse( req, res, next ){
  if( !req.params.order ) { next(); return; }
  var query = JSON.parse(req.params.order);
  var _sort = {};
  for (paramKey in query){
    _sort[paramKey] = parseInt( query[paramKey] );
  }
  req.params.order = _sort;
  
  next();
}

// ?only=["nombre", "apellidos"]
function onlyParse( req, res, next){
  
  if( !req.params.only ) { next(); return; }

  var onlyFields = JSON.parse(req.params.only);
  var noShow = {'_id': 0};
  for (field in onlyFields){
    noShow[onlyFields[field]]=1;
  }
  req.params.only = noShow;

  next();
}

// ?not=["id", "grupo"]
function notParse( req, res, next){
  
  if( !req.params.not ) { next(); return; }

  var onlyFields = JSON.parse(req.params.not);
  var noShow = {'_id': 0};
  for (field in onlyFields){
    noShow[onlyFields[field]]=0;
  }
  req.params.not = noShow;

  next();
}

// ?q={"nombre":"mariano"}
// ?q={"fechahoraJS":{"$gte":"2014-03-27T00:00:00.000Z","$lte":"2014-03-29T00:00:00.000Z"}}
function findParse( req, res, next){
  if( !req.params.q ) { req.params.q = {}; next(); return; }
  req.params.q = parseQuery( {}, req.params.q );
  console.log(req.params.q);
  next();
}

function parseQuery( findParams, query ){
  /*** ISODate pattern
    
    (/(\d{4})\D?(0[1-9]|1[0-2])\D?([12]\d|0[1-9]|3[01])(\D?([01]\d|2[0-3])\D?([0-5]\d)\D?([0-5]\d)?\D?(\d{3})?([zZ]|([\+-])([01]\d|2[0-3])\D?([0-5]\d)?)?)?/)
    .test("2013-05-31T00:00:00.000Z")
  
  */
  var ISODatePattern = new RegExp(/(\d{4})\D?(0[1-9]|1[0-2])\D?([12]\d|0[1-9]|3[01])(\D?([01]\d|2[0-3])\D?([0-5]\d)\D?([0-5]\d)?\D?(\d{3})?([zZ]|([\+-])([01]\d|2[0-3])\D?([0-5]\d)?)?)?/);
  var hasDates = ISODatePattern.test(query);
  var query = JSON.parse(query);
  for( data in query ){
    if( isObject(query[data]) || !isNaN(query[data]) ){
      // es un número o un objeto
      if ( hasDates ) { transformDateRecursive(query) }
      findParams[data] = query[data];
    } else { 
      // Es un texto
      findParams[data] = { $regex: query[data], $options:'i'};
    }
    console.log("findParams",JSON.stringify(findParams));
  }
  return findParams;
}

function isObject(obj){
  return Object.prototype.toString.call(new Object()) == obj;
}

function transformDateRecursive(obj){
  for (var k in obj){
      if ( isObject(obj[k]) && obj[k] !== null)
          transformDateRecursive(obj[k]);
      else {
        //console.log('final',obj[k],k);
        obj[k] = new Date(obj[k]);
      }
  }
} 

apiServer.listen( serverConfig.port, function () {
	console.log('%s listening at %s', apiServer.name, apiServer.url)
});
