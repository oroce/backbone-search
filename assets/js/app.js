var SearchKeywordsCollection = Backbone.Collection.extend();
var initialSuggestions = Array(10).join(0).split(0).map(function( item, i ){
	return {
		id: i,
		item: "Label#"+i
	};
});
var SearchSuggestionModel = Backbone.Model.extend({
	toJSON: function(){
		this.attributes.cid = this.cid;
		return Backbone.Model.prototype.toJSON.apply( this, arguments );
	}
});
var SearchSuggestionCollection = Backbone.Collection.extend({
	model: SearchSuggestionModel,
	url: "http://purposelabs.co:3000/search"
});

var VideoSuggestionCollection = Backbone.Collection.extend({
	url: "http://purposelabs.co:3000/search/videos",
	parse: function( response ){
		return response.result;
	}
});
var SearchView = Backbone.View.extend({
	events: {
		"keyup .search-keyword": "search",
		"click .select-suggestion": "addToKeyword",
		"click .keyword": "removeKeyword"
	},
	initialize: function(){
		this.searchKeywordsCollection = new SearchKeywordsCollection();
		this.searchSuggestionCollection = new SearchSuggestionCollection();
		this.videoSuggestionCollection = new VideoSuggestionCollection();
		this.searchSuggestionCollection
			.on( "reset remove", this.renderSuggestions, this )
			.on( "error", function(){
				window.console ? console.log( "error", arguments ) : void 0;
			});

		this.searchKeywordsCollection
			.on( "add", this.addKeyword, this )
			.on( "reset", this.renderKeywords, this );

		this.videoSuggestionCollection
			.on( "reset", this.renderVideos, this );

		this.suggestionEl = $( "#suggestions" );
		this.keywordListEl = $( ".keyword-list" );
		this.videoEl = $( "#video-container" );
		this.$( ".search-keyword" ).focus();
	},
	fetchVideo: function( val ){
		if( this.videoXhr ){
			this.videoXhr.abort();
		}

		this.videoXhr = this.videoSuggestionCollection
			.fetch({
				data: {
					q: _.compact( _.union( this.searchKeywordsCollection.pluck( "item" ), val ) )
				},
				reset: true
			});
	},
	search: function( e ){
		var el = $( e.currentTarget );

		var val = el.val();

		if( !val ){
			return;
		}
		this.searchSuggestionCollection.fetch({
			data: {
				q: val,
				without: this.searchKeywordsCollection.pluck( "item" )
			},
			reset: true
		});
		this.fetchVideo( val );
	},
	keywordTmpl: _.template( $( ".added-keyword-tmpl" ).text() ),
	suggestionTmpl: _.template( $( ".suggestion-tmpl" ).text() ),
	videoTmpl: _.template( $( ".video-tmpl" ).text() ),
	renderSuggestions: function(){
		this.suggestionEl.empty();

		this.searchSuggestionCollection.each(function( model ){
			this.suggestionEl.append( this.suggestionTmpl({ suggestion: model.toJSON() }) );
		}, this);
	},

	addToKeyword: function( e ){
		var el = $( e.currentTarget );

		var id = el.data( "cid" );

		var suggestion = this.searchSuggestionCollection.get( id );
		if( suggestion ){

			this.searchKeywordsCollection.add( suggestion );
			this.searchSuggestionCollection.remove( suggestion );
			if( suggestion.get("type") === "ac" ){
				this.$( ".search-keyword" ).val( "" );
			}
			this.$( ".search-keyword" ).focus();
			this.fetchVideo( this.$( ".search-keyword" ).val() );
		}
	},
	renderKeywords: function(){
		this.keywordListEl.empty();
		this.searchKeywordsCollection.each( this.addKeyword, this );
	},
	addKeyword: function( model ){
		this.keywordListEl.append( this.keywordTmpl({ keyword: model.toJSON() }) );
	},

	removeKeyword: function( e ){
		var el = $( e.currentTarget );

		var id = el.data( "cid" );

		var keyword = this.searchKeywordsCollection.get( id );

		if( keyword ){
			this.searchKeywordsCollection.remove( keyword ).trigger( "reset" );
			this.searchSuggestionCollection.add( keyword ).trigger( "reset" );

		}
	},
	renderVideo: function( model ){
		this.videoEl.append( this.videoTmpl({ video: model.toJSON() }));
	},
	renderVideos: function(){
		this.videoEl.empty();
		this.videoSuggestionCollection.each( this.renderVideo, this );
	}
});
var App = {};
$(function(){
	App.searchView = new SearchView({
		el: ".container"
	});
})