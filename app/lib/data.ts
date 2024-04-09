const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.MONGODB_URI;
const options = { ordered: true };
// import { sql } from '@vercel/postgres';
// import {
// 	CustomerField,
// 	CustomersTableType,
// 	InvoiceForm,
// 	InvoicesTable,
// 	LatestInvoiceRaw,
// 	User,
// 	Revenue,
// } from './definitions';
import { formatCurrency } from './utils';
const client = await MongoClient.connect(uri);
const db = client.db("accountFunnel");

export async function fetchRevenue(){
	try{
		// Get all Revenue
		const revenueAll = await db.collection("revenue").find({}).toArray();
		// console.log("revenue", revenueAll);
		return revenueAll;
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch revenue data.');
	}
}

export async function fetchLatestInvoices() {
	try{
		// Execute insert operation
		const col = await db.collection("invoices");
		const pipeline = [
			{
				'$sort': { date: -1, _id: 1 }
			}, {
				'$limit': 5
			}, {
				'$lookup': {
					'from': 'customers',
					'localField': 'customer_id',
					'foreignField': 'id',
					'as': 'customerDoc'
				}
			}, {
				'$project': {
					'_id': 1,
					'amount': 1,
					'name': { '$first': '$customerDoc.name' },
					'image_url': { '$first': '$customerDoc.image_url'	},
					'email': { '$first': '$customerDoc.email' }
				}
			}
		];

		const agResults = await col.aggregate(pipeline);
		const data = await agResults.toArray();
		data.forEach(a  => {
			a.amount = formatCurrency(a.amount);
		});

		return data;
	} catch (error) {
		console.error('Database Error: ', error);
		throw new Error('Failed to fetch latest Invoice data.');
	}
}

export async function fetchCardData() {
	try {
// const query = { countries: "Canada" };
    // const countCanada = await movies.countDocuments(query);
		const paidPipe = [
  		{ '$match': {	'status': 'paid' }}, 
  		{ '$group': {	'_id': null, 'paid': {
  			'$sum': '$amount' }}}
		]
		const pendPipe = [
  		{ '$match': {	'status': 'pending' }}, 
  		{ '$group': {	'_id': null, 'pending': {
  			'$sum': '$amount' }}}
		] 

		const col = await db.collection("invoices");
		const invCount = await col.countDocuments({}, { hint: "_id_" });
		const custCount= await db.collection("customers").countDocuments({}, { hint: "_id_" });
		const paidRe = await col.aggregate(paidPipe);
		const pendRe = await col.aggregate(pendPipe);

		const totalPaid = await paidRe.toArray();
		const totalPend = await pendRe.toArray();

		const data = await Promise.all([
			invCount,
			custCount,
			totalPaid[0],
			totalPend[0]
		]);

		const numberOfInvoices = Number(data[0] ?? '0');
		const numberOfCustomers = Number(data[1] ?? '0');
		const totalPaidInvoices = formatCurrency(data[2].paid ?? '0');
		const totalPendingInvoices = formatCurrency(data[3].pending ?? '0');

		return {
			numberOfCustomers,
			numberOfInvoices,
			totalPaidInvoices,
			totalPendingInvoices,
		};
	} catch (error) {
		console.error('Database Error:', error);
		throw new Error('Failed to fetch card data.');
	}
}

// const ITEMS_PER_PAGE = 6;
// export async function fetchFilteredInvoices(
// 	query: string,
// 	currentPage: number,
// ) {
// 	const offset = (currentPage - 1) * ITEMS_PER_PAGE;
//
// 	try {
// 		const invoices = await sql<InvoicesTable>`
// 			SELECT
// 				invoices.id,
// 				invoices.amount,
// 				invoices.date,
// 				invoices.status,
// 				customers.name,
// 				customers.email,
// 				customers.image_url
// 			FROM invoices
// 			JOIN customers ON invoices.customer_id = customers.id
// 			WHERE
// 				customers.name ILIKE ${`%${query}%`} OR
// 				customers.email ILIKE ${`%${query}%`} OR
// 				invoices.amount::text ILIKE ${`%${query}%`} OR
// 				invoices.date::text ILIKE ${`%${query}%`} OR
// 				invoices.status ILIKE ${`%${query}%`}
// 			ORDER BY invoices.date DESC
// 			LIMIT ${ITEMS_PER_PAGE} OFFSET ${offset}
// 		`;
//
// 		return invoices.rows;
// 	} catch (error) {
// 		console.error('Database Error:', error);
// 		throw new Error('Failed to fetch invoices.');
// 	}
// }
//
// export async function fetchInvoicesPages(query: string) {
// 	try {
// 		const count = await sql`SELECT COUNT(*)
// 		FROM invoices
// 		JOIN customers ON invoices.customer_id = customers.id
// 		WHERE
// 			customers.name ILIKE ${`%${query}%`} OR
// 			customers.email ILIKE ${`%${query}%`} OR
// 			invoices.amount::text ILIKE ${`%${query}%`} OR
// 			invoices.date::text ILIKE ${`%${query}%`} OR
// 			invoices.status ILIKE ${`%${query}%`}
// 	`;
//
// 		const totalPages = Math.ceil(Number(count.rows[0].count) / ITEMS_PER_PAGE);
// 		return totalPages;
// 	} catch (error) {
// 		console.error('Database Error:', error);
// 		throw new Error('Failed to fetch total number of invoices.');
// 	}
// }
//
// export async function fetchInvoiceById(id: string) {
// 	try {
// 		const data = await sql<InvoiceForm>`
// 			SELECT
// 				invoices.id,
// 				invoices.customer_id,
// 				invoices.amount,
// 				invoices.status
// 			FROM invoices
// 			WHERE invoices.id = ${id};
// 		`;
//
// 		const invoice = data.rows.map((invoice) => ({
// 			...invoice,
// 			// Convert amount from cents to dollars
// 			amount: invoice.amount / 100,
// 		}));
//
// 		return invoice[0];
// 	} catch (error) {
// 		console.error('Database Error:', error);
// 		throw new Error('Failed to fetch invoice.');
// 	}
// }
//
// export async function fetchCustomers() {
// 	try {
// 		const data = await sql<CustomerField>`
// 			SELECT
// 				id,
// 				name
// 			FROM customers
// 			ORDER BY name ASC
// 		`;
//
// 		const customers = data.rows;
// 		return customers;
// 	} catch (err) {
// 		console.error('Database Error:', err);
// 		throw new Error('Failed to fetch all customers.');
// 	}
// }
//
// export async function fetchFilteredCustomers(query: string) {
// 	try {
// 		const data = await sql<CustomersTableType>`
// 		SELECT
// 			customers.id,
// 			customers.name,
// 			customers.email,
// 			customers.image_url,
// 			COUNT(invoices.id) AS total_invoices,
// 			SUM(CASE WHEN invoices.status = 'pending' THEN invoices.amount ELSE 0 END) AS total_pending,
// 			SUM(CASE WHEN invoices.status = 'paid' THEN invoices.amount ELSE 0 END) AS total_paid
// 		FROM customers
// 		LEFT JOIN invoices ON customers.id = invoices.customer_id
// 		WHERE
// 			customers.name ILIKE ${`%${query}%`} OR
// 				customers.email ILIKE ${`%${query}%`}
// 		GROUP BY customers.id, customers.name, customers.email, customers.image_url
// 		ORDER BY customers.name ASC
// 		`;
//
// 		const customers = data.rows.map((customer) => ({
// 			...customer,
// 			total_pending: formatCurrency(customer.total_pending),
// 			total_paid: formatCurrency(customer.total_paid),
// 		}));
//
// 		return customers;
// 	} catch (err) {
// 		console.error('Database Error:', err);
// 		throw new Error('Failed to fetch customer table.');
// 	}
// }
//
// export async function getUser(email: string) {
// 	try {
// 		const user = await sql`SELECT * FROM users WHERE email=${email}`;
// 		return user.rows[0] as User;
// 	} catch (error) {
// 		console.error('Failed to fetch user:', error);
// 		throw new Error('Failed to fetch user.');
// 	}
// }
