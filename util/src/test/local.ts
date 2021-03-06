/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import * as yargs from 'yargs';
import { main } from '../main';

const delay: number = 500;

// The following test suite should only be run locally
describe('The console-line interface usage', () => {
	beforeAll(() => {
		// Hijack console functions to suppress logs
		console.log = () => {
			// Empty
		};
		console.error = () => {
			// Empty
		};
	});
	it('Should work with file path specified', () => {
		yargs.parse(['visualize', '.\\example\\line.json']);
		main();
		setTimeout(() => {
			expect(process.exitCode).toBe(0);
		}, delay);
	});
	it('Should accept different input formats', () => {
		yargs.parse(['visualize', '.\\example\\json.json', '--inputFormat', 'json']);
		main();
		setTimeout(() => {
			expect(process.exitCode).toBe(0);
		}, delay);
	});
});
