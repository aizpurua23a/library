var Genre = require('../models/genre');

//other imports
var Book = require('../models/book');
var async = require('async');

//Validator
const { body,validationResult } = require('express-validator')
const { sanitizeBody } = require('express-validator');

// Display list of all Genre.
exports.genre_list = function(req, res) {

  Genre.find()
  .sort([['name', 'ascending']])
  .exec(function (err, list_genres){
    if (err) {return next(err);}
    res.render('genre_list', {
      title: 'Genre List',
      genre_list: list_genres,
    });
  });

};

// Display detail page for a specific Genre.
exports.genre_detail = function(req, res, next) {
  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id)
      .exec(callback);
    },

    genre_books: function(callback){
      Book.find({ 'genre': req.params.id})
      .exec(callback);
    },
  },  function(err, results){
    if (err) {return next(err);}
    if (results.genre==null) {
      var err = new Error('Genre not found');
      err.status = 404;
      return next(err);
    }

    res.render('genre_detail', {
      title: 'Genre Detail',
      genre: results.genre,
      genre_books: results.genre_books
    });
  });
};

// Display Genre create form on GET.
exports.genre_create_get = function(req, res) {
    res.render('genre_form',{title: 'Create Genre'});
};

// Handle Genre create on POST.
exports.genre_create_post = [
  //validate that the name field is not empty.
  body('name', 'Genre name required').trim().isLength({min: 1}),
  sanitizeBody('name').escape(),

  (req,res,next) => {
    const errors = validator.validationResult(req);
    var genre = new Genre(
      {name: req.body.name}
    );

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render('genre_form', { title: 'Create Genre', genre: genre, errors: errors.array()});
      return;
    }
    else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      Genre.findOne({ 'name': req.body.name })
      .exec( function(err, found_genre) {
        if (err) { return next(err); }
        if (found_genre) {
          // Genre exists, redirect to its detail page.
          res.redirect(found_genre.url);
        }
        else {
          genre.save(function (err) {
            if (err) { return next(err);
            }
            // Genre saved. Redirect to genre detail page.
            res.redirect(genre.url);
          });
        }
      });
    }
  }
];

// Display Genre delete form on GET.
exports.genre_delete_get = function(req, res) {
  async.parallel({
    genre: function(callback){
      Genre.findById(req.params.id)
      .exec(callback);
    },

    genre_books: function(callback){
      Book.find({ 'genre': req.params.id})
      .exec(callback);
    },
  },  function(err, results){
    if (err) {return next(err);}
    if (results.genre==null) {
      res.redirect('/catalog/genres');
    }

    res.render('genre_delete',{
      title: 'Delete Genre',
      genre: results.genre,
      genre_books: results.genre_books,
    });
  });
};

// Handle Genre delete on POST.
exports.genre_delete_post = function(req, res, next) {
  async.parallel({
    genre: function(callback) {
      Genre.findById(req.body.genreid).exec(callback);
    },
    genre_books: function(callback) {
      Book.find({ 'genre': req.body.genreid }).exec(callback);
    }
  }, function(err, results){
    if (err) {return next(err)}
    if (results.genre_books.length > 0) {
      res.render('genre_delete', {
        title: 'Delete Genre',
        genre: results.genre,
        genre_books: results, genre_books
      });
    } else {
      Genre.findByIdAndRemove(req.body.genreid)
      .exec( function (err) {
        if (err) {return next(err)}
        res.redirect('/catalog/genres')
      });
    }
  });
};


// Display Genre update form on GET.
exports.genre_update_get = function(req, res, next) {
    Genre.findById(req.params.id)
    .exec( function (err, genre){
      if (err) {next(err)}
      if (genre==null){
        var err = new Error ('Genre not found');
        err.status = 404;
        return next(err);
      }
      res.render('genre_form',{
        title: 'Update Genre',
        genre: genre
      });
    }
  );
};

// Handle Genre update on POST.
exports.genre_update_post = [
  //validate fields
  body('name', 'Genre must not be empty').isLength({min: 1}).trim(),
  sanitizeBody('name').escape(),

  (req,res,next) => {
    const errors = validationResult(req);

    //Genre creation
    var genre = new Genre({
      name: req.body.name,
      _id:req.params.id
    });

    //If there are erros, we go back to the form with them
    if (!errors.isEmpty()){
      res.render('genre_form',{
        title: 'Update Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      //If all's well, we find and update
      Genre.findByIdAndUpdate(req.params.id, genre, {}, function (err,thegenre){
        if (err) {return next(err);}
        res.redirect(thegenre.url);
      });
    }
  }
]
