/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as os from 'os';

import * as ts from 'typescript';

import { Vertex, Edge, Id, Element } from 'lsif-protocol';

import { lsif as _lsif } from '../lsif';
import { Emitter } from '../emitters/emitter';
import { Builder } from '../graph';
import { URI } from 'vscode-uri';

export class InMemoryLanguageServiceHost implements ts.LanguageServiceHost {

	private scriptSnapshots: Map<string, ts.IScriptSnapshot>;

	constructor(private cwd: string, private scripts: Map<string, string>, private options: ts.CompilerOptions) {
		this.scriptSnapshots = new Map();
	}

	public getScriptFileNames(): string[] {
		return Array.from(this.scripts.keys());
	}

	public getCompilationSettings(): ts.CompilerOptions {
		return this.options;
	}

	public getScriptVersion(fileName: string): string {
		return '0';
	}

	public getProjectVersion(): string {
		return '0';
	}

	public getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
		let result: ts.IScriptSnapshot | undefined = this.scriptSnapshots.get(fileName);
		if (result === undefined) {
			const content = this.scripts.get(fileName);
			if (content === undefined) {
				return undefined;
			}
			result = ts.ScriptSnapshot.fromString(content);
			this.scriptSnapshots.set(fileName, result);
		}
		return result;
	}

	public getCurrentDirectory(): string {
		return this.cwd;
	}

	public getDefaultLibFileName(options: ts.CompilerOptions): string {
		const result = ts.getDefaultLibFilePath(options);
		return result;
	}

	public directoryExists(path: string): boolean  {
		const result = ts.sys.directoryExists(path);
		return result;
	}

	public getDirectories(path: string): string[] {
		const result = ts.sys.getDirectories(path);
		return result;
	}

	public fileExists(path: string): boolean {
		const result = ts.sys.fileExists(path);
		return result;
	}

	public readFile(path: string, encoding?:string): string | undefined {
		const result = ts.sys.readFile(path, encoding);
		return result;
	}

	public readDirectory(path: string): string[] {
		const result = ts.sys.readDirectory(path);
		return result;
	}
}

class TestEmitter implements Emitter {

	private sequence: Element[];
	public elements: Map<Id, Element>;

	constructor() {
		this.sequence = [];
		this.elements = new Map();
	}

	public start(): void {
	}

	emit(element: Vertex | Edge): void {
		this.sequence.push(element);
		this.elements.set(element.id, element);
	}

	public end(): void {
	}

	public toString(): string {
		const buffer: string[] = [];
		for (const element of this.sequence) {
			buffer.push(JSON.stringify(element, undefined, 0));
		}
		return buffer.join(os.EOL);
	}
}

export function lsif(cwd: string, scripts: Map<string, string>, options: ts.CompilerOptions): TestEmitter {
	const emitter = new TestEmitter();
	const host = new InMemoryLanguageServiceHost(cwd, scripts, options);
	const languageService = ts.createLanguageService(host);
	let counter = 1;
	const generator = (): number => {
		return counter++;
	};
	const builder = new Builder({ idGenerator: generator, emitSource: false });

	const group = builder.vertex.group(URI.from({ scheme: 'lsif-test', path: cwd }).toString(), cwd, URI.from({ scheme: 'lsif-test', path: cwd }).toString());
	_lsif(emitter, builder, languageService, [], { stdout: true, projectRoot: cwd, projectName: cwd, group: group, tsConfigFile: undefined });
	return emitter;
}