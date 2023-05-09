import {useEffect, useState} from 'react';
import './App.css';
import 'react-data-grid/lib/styles.css';
import axios from 'axios';
import DataGrid from 'react-data-grid';
import {LoremIpsum} from 'lorem-ipsum';
import ClayAlert from '@clayui/alert';
import {ClayPaginationBarWithBasicItems} from '@clayui/pagination-bar';
import {
	fetchListTypeDefinitions,
	LIST_TICKET_PRIORITIES,
	LIST_TICKET_REGIONS,
	LIST_TICKET_STATUSES,
	LIST_TICKET_RESOLUTIONS,
	LIST_TICKET_TYPES,
} from './listTypeEntries';
import RelativeTime from '@yaireo/relative-time'


const relativeTime = new RelativeTime();
const lorem = new LoremIpsum();

let listTypeDefinitions = {};

function getRandomElement(array) {
	return array[Math.floor(Math.random() * array.length)].key;
}

async function addTestRow() {
	if (!(LIST_TICKET_PRIORITIES in listTypeDefinitions)) {
		listTypeDefinitions = await fetchListTypeDefinitions();
	}
	const priorities = listTypeDefinitions[LIST_TICKET_PRIORITIES];
	const statuses = listTypeDefinitions[LIST_TICKET_STATUSES];
	const regions = listTypeDefinitions[LIST_TICKET_REGIONS];
	const resolutions = listTypeDefinitions[LIST_TICKET_RESOLUTIONS];
	const types = listTypeDefinitions[LIST_TICKET_TYPES];

	await axios.post(`/o/c/tickets?p_auth=${Liferay.authToken}`, {
		priority: {
			key: getRandomElement(priorities),
		},
		status: {
			code: 0,
		},
		resolution: {
			key: getRandomElement(resolutions),
		},
		subject: lorem.generateWords(8),
		supportRegion: {
			key: getRandomElement(regions),
		},
		ticketStatus: {
			key: getRandomElement(statuses),
		},
		type: {
			key: getRandomElement(types),
		},
	});
}

const initialToastState = {
	content: null,
	show: false,
	type: null,
};

const initialFilterState = {
	field: '',
	value: '',
};

const filters = [
	{
		field: 'ticketStatus',
		value: 'open',
		text: 'Open issues',
	},
	{
		field: 'priority',
		value: 'major',
		text: 'Major Priority issues',
	},
	{
		field: 'resolution',
		value: 'unresolved',
		text: 'Unresolved issues',
	},
];

function App() {
	const [rows, setRows] = useState([]);
	const [recentTickets, setRecentTickets] = useState([]);
	const [filter, setFilter] = useState(initialFilterState);
	const [page, setPage] = useState(1);
	const [pageSize, setPageSize] = useState(20);
	const [search, setSearch] = useState();
	const [totalCount, setTotalCount] = useState(0);
	const [toastMessage, setToastMessage] = useState(initialToastState);

	async function fetchTickets() {
		const filterSnippet =
			filter && filter.field && filter.value
				? encodeURI(`&filter=${filter.field} eq '${filter.value}'`)
				: '';
		const searchSnippet = search ? encodeURI(`&search=${search}`) : '';
		const {data} = await axios.get(
			`/o/c/tickets?p_auth=${Liferay.authToken}&pageSize=${pageSize}&page=${page}${filterSnippet}${searchSnippet}`
		);

		setTotalCount(data.totalCount);
		setRows(
			data?.items.map((row) => ({
				priority: row.priority?.name,
				resolution: row.resolution?.name,
				subject: row.subject,
				supportRegion: row.supportRegion?.name,
				ticketStatus: row.ticketStatus?.name,
				type: row.type?.name,
			}))
		);
	}

	async function fetchRecentTickets() {
		const {data} = await axios.get(
			`/o/c/tickets?p_auth=${Liferay.authToken}&pageSize=3&page=1&sort=id:desc`
		);

		setRecentTickets(
			data?.items.map((row) => ({
				dateCreated: new Date(row.dateCreated),
				id: row.id,
				priority: row.priority?.name,
				resolution: row.resolution?.name,
				subject: row.subject,
				supportRegion: row.supportRegion?.name,
				ticketStatus: row.ticketStatus?.name,
				type: row.type?.name,
			}))
		);
	}

	useEffect(() => {
		fetchTickets();
	}, [page, pageSize, filter, search]);

	useEffect(() => {
		fetchRecentTickets();
	}, []);

	const columns = [
		{key: 'subject', name: 'Subject', width: '45%'},
		{key: 'resolution', name: 'Resolution', width: '15%'},
		{key: 'ticketStatus', name: 'Status', width: '10%'},
		{key: 'priority', name: 'Priority', width: '10%'},
		{key: 'type', name: 'Type', width: '10%'},
		{key: 'supportRegion', name: 'Region', width: '10%'},
	];

	return (
		<section className="container current-tickets m-0 p-0 row">
			<div className="col-md-2">
				<nav className="h-100 site-navigation">
					<h6 className="text-uppercase">Site</h6>
					<ul>
						<li>
							<a href="">Dashboards</a>
						</li>
						<li>
							<a href="">Projects</a>
						</li>
						<li>
							<a href="">Issues</a>
						</li>
					</ul>
				</nav>
			</div>
			<div className="col-md-10">
				<header className="align-items-center bg-light mb-3 p-3 row">
					<h1> Your Tickets</h1>
					<button
						className="btn btn-primary ml-auto"
						onClick={(event) => {
							async function createNewTicket() {
								await addTestRow();
								fetchTickets();
								fetchRecentTickets();

								setToastMessage({
									content: 'A new ticket was added!',
									show: true,
									type: 'success',
								});
							}
							createNewTicket();
							event.preventDefault();
						}}
					>
						Create a New Ticket
					</button>
				</header>
				<main className="row p-0">
					<div className="col-md-10 m-0 p-0 pr-3">
						<input
							className="mb-3 w-100"
							placeholder="Search Tickets"
							type="text"
							onChange={(event) => {
								setSearch(event.target.value);
							}}
						></input>
						<DataGrid
							columns={columns}
							rows={rows}
							onRowsChange={setRows}
						/>
						<div className="my-3">
							<ClayPaginationBarWithBasicItems
								defaultActive={page}
								active={page}
								activeDelta={pageSize}
								ellipsisBuffer={3}
								ellipsisProps={{
									'aria-label': 'More',
									'title': 'More',
								}}
								onDeltaChange={(pageSize) => {
									setPageSize(pageSize);
								}}
								onActiveChange={(page) => {
									setPage(page);
								}}
								spritemap={Liferay.Icons.spritemap}
								totalItems={totalCount}
							/>
						</div>
					</div>
					<nav className="col-md-2 ml-auto">
						<h6 className="text-uppercase">Filters</h6>
						<ul>
							{filters.map((thisFilter, index) => (
								<li key={index}>
									<a
										className={
											filter === thisFilter
												? 'font-weight-bold'
												: ''
										}
										href=""
										onClick={(event) => {
											if (filter === thisFilter) {
												setFilter(initialFilterState);
											} else {
												setFilter(thisFilter);
											}
											event.preventDefault();
										}}
									>
										{thisFilter.text}
									</a>
								</li>
							))}
						</ul>
					</nav>
				</main>
			</div>
			<div className="col pr-0">
				<footer className="bg-light p-3 w-100 my-3">
					<h2>Recent Activity</h2>
					<ul>
						{recentTickets.length > 0 &&
							recentTickets.map((recentTicket, index) => (
								<li key={index}>
									Ticket #{recentTicket.id} was created with
									status "{recentTicket.ticketStatus}" for
									support region {recentTicket.supportRegion} {relativeTime.from(recentTicket.dateCreated)}.
								</li>
							))}
						{recentTickets.length === 0 && (
							<>
								<li>
									Ticket #1234 closed with status "Resolved"
									by administrator
								</li>
								<li>
									Ticket #4566 closed with status "Won't fix"
									by administrator
								</li>
							</>
						)}
					</ul>
				</footer>
			</div>
			{toastMessage.show && (
				<ClayAlert.ToastContainer>
					<ClayAlert
						autoClose={3000}
						displayType={toastMessage.type}
						onClose={() => setToastMessage(initialToastState)}
						spritemap={Liferay.Icons.spritemap}
					>
						{toastMessage.content}
					</ClayAlert>
				</ClayAlert.ToastContainer>
			)}
		</section>
	);
}

export default App;
