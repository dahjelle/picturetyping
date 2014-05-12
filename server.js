#!/usr/bin/env node

"use strict";

// static server bit taken from https://gist.github.com/rpflorence/701407

var fs = require( "fs" );
var path = require( "path" );
var glob = require( "glob" );
var http = require( "http" );
var url = require( "url" );
var port = process.argv[ 2 ] || 8888;
require( "sugar" );
Object.extend();

http.createServer(function(request, response) {
    var uri = url.parse(request.url).pathname,
        filename = path.join(process.cwd(), uri);
    console.log( uri, filename );
    if ( uri === "/images" || uri === "/images/" ) {
        response.writeHead( 200, {
            "Content-Type": "application/json"
        } );
        response.write( JSON.stringify( makeMatchList( "images" ) ) );
        response.end();
    } else {
        fs.exists(filename, function(exists) {
            // should probably also return 404 for server.js
            if (!exists) {
                response.writeHead(404, {
                    "Content-Type": "text/plain"
                });
                response.write("404 Not Found\n");
                response.end();
                return;
            }

            if (fs.statSync(filename).isDirectory()) filename += '/index.html';

            fs.readFile(filename, "binary", function(err, file) {
                if (err) {
                    response.writeHead(500, {
                        "Content-Type": "text/plain"
                    });
                    response.write(err + "\n");
                    response.end();
                    return;
                }

                response.writeHead(200);
                response.write(file, "binary");
                response.end();
            });
        });
    }
}).listen( parseInt( port, 10 ) );

console.log("Static file server running at\n => http://localhost:" + port + "/\nCTRL + C to shutdown");

var makeMatchList = function( image_dir ) {
    var matches = glob.sync( "**", {
        cwd: image_dir
    } );
    matches = filterMatches( matches, image_dir );
    var map = matchesToMap( matches, image_dir );
    return map;
};

var filterMatches = function( matches, image_dir ) {
    return matches.filter( function( match ) {
        if ( match === "" ) {
            return false;
        }
        return fs.statSync( image_dir + "/" + match ).isFile();
    } );
};

var matchesToMap = function( matches, image_dir ) {
    var map = {};
    matches.each( function( match ) {
        var key = path.dirname( match );
        if ( !Object.isArray( map[ key ] ) ) {
            map[ key ] = [];
        }
	map[ key ].push( image_dir + "/" + match );
    } );
    return map;
};

makeMatchList( "images" );
