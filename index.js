#!/usr/bin/env node

const Request = require('request.libary'),
	AdmZip = require('adm-zip'),
	promise = require('promise.util'),
	remove = require('fs.remove'),
	{Cli, Map} = require('cli.util');

class Bsaber {

	constructor(host = 'https://bsaber.com') {
		this.api = host;
	}

	get request() {
		return new Request(this.api);
	}

	search(src) {
		console.log('get', src);
		return this.request.headers({
			'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
		}).get(src).then((res) => {
			if (res.isOkay()) {
				let data = res.body().toString().match(/<a\sclass=".*?-download-zip.*?"\shref="(.*?)"/g);
				data = data.map((r) => {
					const c = r.match(/<a\sclass=".*?-download-zip.*?"\shref="(.*?)"/);
					console.log(c[1]);
					return c[1];
				});
				return data;
			}
			console.log('failed to get page', src, res.status());
			return [];
		});
	}

	download(u) {
		const key = u.match(/key\/(.*?)$/)[1], out = `${key}.zip`;
		return Request.download(u, out, false, {
			headers: {
				'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/81.0.4044.138 Safari/537.36'
			}
		}).then(() => {
			let zip = new AdmZip(out);
			zip.extractAllTo(`./${key}/`, true);
			return remove(out);
		});
	}

}

let cli = new Cli(process.argv, [
	new Map('url')
		.alias(['u', 'U'])
		.argument(),
	new Map('thread')
		.alias(['t', 'T'])
		.argument()
], 1);
const g = new Bsaber();

if (cli.has('url')) {
	g.search(cli.get('url')).then((res) => {
		console.log(res);
		return promise.each(res, (file) => {
			return g.download(file).then(() => {
				console.log('downloaded', file);
			});
		}, cli.get('url') || 2);
	});
}

