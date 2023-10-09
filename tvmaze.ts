"use strict";

import jQuery from "jquery";

const $ = jQuery;

const $showsList = $("#showsList");
const $episodesArea = $("#episodesArea");
const $episodesList = $("#episodesList");
const $searchForm = $("#searchForm");

const TVMAZE_BASE_URL = "https://api.tvmaze.com";
const DEFAULT_IMAGE_URL = "https://tinyurl.com/tv-missing";

interface ShowInterface {
  id: number;
  name: string;
  summary: string;
  image: string;
}

interface EpisodeInterface {
  id: number;
  name: string;
  season: number;
  number: number;
}

/** Given a search term, search for tv shows that match that query.
 *
 *  Returns (promise) array of show objects: [show, show, ...].
 *    Each show object should contain exactly: {id, name, summary, image}
 *    (if no image URL given by API, put in a default image URL)
 */

async function searchShowsByTerm(term: string): Promise<ShowInterface[]> {
  const q = term;
  const params = new URLSearchParams({ q });

  const response = await fetch(`${TVMAZE_BASE_URL}/search/shows?${params}`);
  const showData: Record<string, any>[] = await response.json(); // FIXME:

  const filteredData = showData.map((show: Record<string, any>) => ({
    id: show.show.id,
    name: show.show.name,
    summary: show.show.summary,
    image: show.show.image?.medium || DEFAULT_IMAGE_URL,
  }));

  return filteredData;
}

/** Given list of shows, create markup for each and to DOM */

function populateShows(shows: ShowInterface[]): void {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(
      `<div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img
              src=${show.image}
              alt=${show.name}
              class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
       </div>
      `
    );

    $showsList.append($show);
  }
}

/** Handle search form submission: get shows from API and display.
 *    Hide episodes area (that only gets shown if they ask for episodes)
 */

async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();
  const shows = await searchShowsByTerm(term);

  $episodesArea.hide();
  populateShows(shows);
}

$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

/** Given a show ID, get from API and return (promise) array of episodes:
 *      { id, name, season, number }
 */

async function getEpisodesOfShow(id: number): Promise<EpisodeInterface[]> {
  const response = await fetch(`${TVMAZE_BASE_URL}/shows/${id}/episodes`);
  const episodeData = await response.json();

  const filteredData = episodeData.map((episode: Record<string, any>) => ({
    id: episode.id,
    name: episode.name,
    season: episode.season,
    number: episode.number,
  }));

  return filteredData;
}

/** Given an array of episodes [{ id, name, season, number }, ... ], populate
 * episode data into DOM. */

function populateEpisodes(episodes: EpisodeInterface[]): void {
  $episodesList.empty();

  for (let episode of episodes) {
    const $episode = $(
      `<li>${episode.name} (Season ${episode.season}, Number ${episode.number})</li>`
    );

    $episodesList.append($episode);
  }

  /** handles click on show episodes button */
  $showsList.on("click", ".Show-getEpisodes", (evt) => {
    const id = $(evt.target).closest('data-show-id');
    const episodes = getEpisodesOfShow(Number(id));
    populateEpisodes(episodes);
    $episodesList.show();

  });
}