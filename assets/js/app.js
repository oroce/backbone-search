var SearchKeywordsCollection = Backbone.Collection.extend();
var initialSuggestions = Array(10).join(0).split(0).map(function( item, i ){
	return {
		id: i,
		item: "Label#"+i
	};
});

var SearchSuggestionCollection = Backbone.Collection.extend({
	fetch: function( options ){
		options || (options = {});

		var self = this;
		setTimeout(function(){
			var newItems = initialSuggestions
			if( options.without ){
				var withoutIds = _.pluck( options.without, "id" );
				newItems = newItems.filter(function( item ){
					return withoutIds.indexOf( item.id ) === -1;
				})
			}
			self.reset( _.shuffle( newItems ) );
		}, 10 );
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

		this.searchSuggestionCollection.on( "reset remove", this.renderSuggestions, this );

		this.searchKeywordsCollection
			.on( "add", this.addKeyword, this )
			.on( "reset", this.renderKeywords, this );


		this.suggestionEl = $( "#suggestions" );
		this.keywordListEl = $( ".keyword-list" );
	},

	search: function( e ){
		var el = $( e.currentTarget );

		var val = el.val();

		if( !val ){
			return;
		}
		this.searchSuggestionCollection.fetch({
			without: this.searchKeywordsCollection.toJSON(),
			data: {
				q: val
			}
		});
	},
	keywordTmpl: _.template( $( ".added-keyword-tmpl" ).text() ),
	suggestionTmpl: _.template( $( ".suggestion-tmpl" ).text() ),
	renderSuggestions: function(){
		this.suggestionEl.empty();

		this.searchSuggestionCollection.each(function( model ){
			this.suggestionEl.append( this.suggestionTmpl({ suggestion: model.toJSON() }) );
		}, this);
	},

	addToKeyword: function( e ){
		var el = $( e.currentTarget );

		var id = el.data( "id" );

		var suggestion = this.searchSuggestionCollection.get( id );
		if( suggestion ){
			this.searchKeywordsCollection.add( suggestion );
			this.searchSuggestionCollection.remove( suggestion );
			this.$( ".search-keyword" ).val( "" );
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

		var id = el.data( "id" );

		var keyword = this.searchKeywordsCollection.get( id );

		if( keyword ){
			this.searchKeywordsCollection.remove( keyword ).trigger( "reset" );
			this.searchSuggestionCollection.add( keyword ).trigger( "reset" );

		}
	}
});
var App = {};

App.searchView = new SearchView({
	el: ".container"
});