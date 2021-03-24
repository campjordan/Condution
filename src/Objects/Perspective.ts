import type { Filterable } from "./Utils";

import Task from "./Task";
import Tag from "./Tag";
import Project from "./Project";

import { Query } from "./Utils";

import { Context } from "./EngineManager";

class LogicGroup {
    rawString:string;

    private simpleGroup: RegExp = /\[.*?\]/; // query for the "simple" part of the capture group
    private directionality: RegExp = /^\(*\$/; // $PARAM <=> [FILTER]$PARAM should match; not the other way
    private logicParameterComponent: RegExp = /\[.*?\]\$(\w+)/; // query for the parametered part of the logic [#this .that]$THIS_PART_HERE
    private independentParameterComponent: RegExp = /[^\])]\$([\w- :+-/]+)/; // query for the independent parameter of the logic $THAT_OTHER_PART
    private independentParameterGroupComponent: RegExp = /(\w+) *([+-]*) *(\d*)/; // query for the three parts of the independent parameter. Like today+13
    private operatorTest: RegExp = /([>=<|])/; // the operator >, =, <

    private query:Query;
    private simple:SimpleGroup;

    private operator:string;
    private logicParameter:string;
    private indepParameter:string;
    private indepParameterGroups:string[];

    private indepParamData: any;

    constructor(query:Query, queryString:string) {
        this.rawString = queryString;
        this.query = query;

        this.simple = new SimpleGroup(query, [...queryString.match(this.simpleGroup)][0]);

        this.logicParameter = [...this.logicParameterComponent.exec(queryString)][1];
        this.indepParameter = [...this.independentParameterComponent.exec(queryString)][1].trim();
        this.indepParameterGroups = [...this.independentParameterGroupComponent.exec(queryString)];

        let operator: string = [...this.operatorTest.exec(queryString)][1];

        let directionality:boolean = this.directionality.test(queryString);

        if (!directionality) { // flip the sign
            if (operator == "<") operator = ">";
            else if (operator == ">") operator = "<";
        }

        this.operator = operator;

        // Clean all indexes
        this.simpleGroup.lastIndex = 0;
        this.logicParameterComponent.lastIndex = 0;
        this.independentParameterComponent.lastIndex = 0;
        this.operatorTest.lastIndex = 0;
        this.directionality.lastIndex = 0;
        this.independentParameterGroupComponent.lastIndex = 0;

        this.parseIndepParam();
    }

    private parseIndepParam() {
        // Get the param to parse
        let param:string = this.indepParameter;

        // Try to parse as string parameter
        switch (this.indepParameterGroups[1]) {
            case "today": // this is literally the only macro param we have  :(
                let today = new Date(); // today
                // if no more operators, just return
                if (this.indepParameterGroups[2] == '') return this.indepParamData=today, null;
                // if + operator, add the correct number of days
                else if (this.indepParameterGroups[2] == "+") {
                    today.setDate(today.getDate()+parseInt(this.indepParameterGroups[3]));
                    return this.indepParamData=today, null
                }
                // if - operator, subtract the correct number of days
                else if (this.indepParameterGroups[2] == "-") {
                    today.setDate(today.getDate()-parseInt(this.indepParameterGroups[3]));
                    return this.indepParamData=today, null
                }

                break;
        }

        // Early date parse exceptions
        if (param.includes("/") || param.includes("-")) {
            let unixDate:number = Date.parse(param);
            console.log(unixDate);
            if (!isNaN(unixDate)) return this.indepParamData=new Date(unixDate), null;
        }

        // Try to parse as a number
        let intParam:number = parseFloat(param);
        if (!isNaN(intParam)) return this.indepParamData=intParam, null;

        // Late last-ditch heuristic date parse
        let unixDate:number = Date.parse(param);
        if (!isNaN(unixDate)) return this.indepParamData=new Date(unixDate), null;

        // And finally, we give up
        this.indepParamData = param;
    }

     /**
     * Sythesize the filter functions needed
     * @async
     *
     * @returns{Promise<((i:Filterable)=>boolean)[][]>}
     *
     */

    async synthesize() : Promise<((i:Filterable)=>boolean)[][]> {
        let coreFilters: ((i:Filterable)=>boolean)[][] = await this.simple.synthesize();
        let compoundAddition: ((i:Filterable)=>boolean);

        switch (this.logicParameter) {
            case "due":
                if (this.operator == "<") compoundAddition = (i:Task) => i.due < this.indepParamData;
                else if (this.operator == ">") compoundAddition = (i:Task) => i.due > this.indepParamData;
                else if (this.operator == "=") compoundAddition = (i:Task) => i.due == this.indepParamData;
                break;
            case "defer":
                if (this.operator == "<") compoundAddition = (i:Task) => i.defer < this.indepParamData;
                else if (this.operator == ">") compoundAddition = (i:Task) => i.defer > this.indepParamData;
                else if (this.operator == "=") compoundAddition = (i:Task) => i.defer == this.indepParamData;
                break;
            case "weight":
                if (this.operator == "<") compoundAddition = (i:Task) => i.weight < this.indepParamData;
                else if (this.operator == ">") compoundAddition = (i:Task) => i.weight > this.indepParamData;
                else if (this.operator == "=") compoundAddition = (i:Task) => i.weight == this.indepParamData;
                break;
            case "name":
                if (this.operator == "=") compoundAddition = (i:Task) => i.name == this.indepParamData;
                else if (this.operator == "") compoundAddition = (i:Task) => i.name.includes(this.indepParamData);
                break;
            case "description":
            case "desc":
                if (this.operator == "=") compoundAddition = (i:Task) => i.description == this.indepParamData;
                else if (this.operator == "") compoundAddition = (i:Task) => i.description.includes(this.indepParamData);
                break;

        }

        coreFilters.forEach((i:Function[]) => i.push(compoundAddition));
        return coreFilters;
    }
}

class SimpleGroup {
    rawString:string;

    private simpleGroupFilters: RegExp = /(!?[#!.][^#!.\[\]]+)(?<! )/g;  // query for each filter in a simple group

    private query:Query;
    private filters: string[];

    constructor(query:Query, queryString:string) {
        this.rawString = queryString;
        this.query = query;

        // get and store the list of filters
        this.filters = [...queryString.match(this.simpleGroupFilters)];
    }

    /**
     * Sythesize the filter functions needed
     * @async
     *
     * @returns{Promise<((i:Filterable)=>boolean)[][]>}
     *
     */

    async synthesize() : Promise<((i:Filterable)=>boolean)[][]> {
        let positiveprojects:Project[] = [];
        let negateprojects:Project[] = [];

        let positivetags:Tag[] = [];
        let negatetags:Tag[] = [];

        let result:((i:Filterable)=>boolean)[][] = [];

        await Promise.all(this.filters.map(async (filter:string) => {
            // Check for negate condition
            let negate:boolean = filter[0] === "!";

            // Then, slice for negate
            if (negate)
                filter = filter.slice(1);

            // Get the operation (tag? project?)
            let operation:string = filter[0];
            
            // Slice out the operation
            filter = filter.slice(1);

            switch (operation) {
                case ".": 
                // GET READY FOR LOTS OF CODE!! ITS TIME TO: BFS THROUGH THE PROJECT LIST 
                // SO THAT WE GET ALL OF THE SUBPROJECTS!  FUN TIMES AGLORE!!

                // Get matching projects
                let projects:Project[] = await this.query.execute(Project, (i:Project) => i.name === filter) as Project[];

                // List the IDs
                let targets:Project[] = [];

                // Get project children
                let children:(Project|Task)[][] = await Promise.all(projects.map(async (proj:Project) => {
                    targets.push(proj);
                    return await proj.async_children;
                }));

                // Get subproject list
                let subprojects:Project[] = [];

                // Get the IDs of subprojects
                await Promise.all(children.map(async (projectChildren) => await Promise.all(projectChildren.map(async (item:Project|Task) => {
                    // check if project
                    if (item.databaseBadge === "projects") {
                        // push the ID to target
                        targets.push(item as Project);
                        // push project to list
                        subprojects.push(item as Project);
                    }
                }))));

                // BFS through project list to get all children
                while (subprojects.length > 0) {
                    // Pop the top
                    (await subprojects.pop().async_children).map(async (item:Project|Task) => {
                        // check if project
                        if (item.databaseBadge === "projects") {
                            // push the ID to target
                            targets.push(item as Project);
                            // push project to list
                            subprojects.push(item as Project);
                        }
                    })
                }

                if (negate) negateprojects = [...negateprojects, ...targets];
                else positiveprojects = [...positiveprojects, ...targets];

                break;

                case "#": 
                // Get the zeroeth matching tag TODO bad idea?
                let tags:Tag[] = await this.query.execute(Tag, (i:Tag) => i.name === filter) as Tag[];
                let tag:Tag = tags[0];

                // That's it! Horray! That was easy.
                if (negate) negatetags.push(tag);
                else positivetags.push(tag);
            }
        }));

        for (let i:number=0; i<=(positiveprojects.length > 0 ? positiveprojects.length-1 : 0 ); i++) {
            let tempResult: ((i:Filterable)=>boolean)[] = [];

            if (i !== positiveprojects.length) tempResult.push((t:Task) => t.project == positiveprojects[i]);

            negateprojects.forEach((j:Project) => tempResult.push((t:Task) => t.project != j));

            positivetags.forEach((h:Tag) => tempResult.push((t:Task) => t.tags.includes(h)));

            negatetags.forEach((h:Tag) => tempResult.push((t:Task) => !t.tags.includes(h)));

            result.push(tempResult);
        }

        return result;
    }
}


class PerspectiveQuery {
    rawString:string;

    private groupCapture: RegExp = /(\[.*?\]|\(.*?\))/g; // query for the capture units like [#this] or ([#that]$due < $defer)
    private logicGroup: RegExp = /\(.*?\[[^()]+?]\$.*?\)/; // query test for whether the capture group is a logic group, ([#that]$due < $defer)

    logicGroups:LogicGroup[];
    simpleGroups:SimpleGroup[];

    queryEngine:Query;

    constructor(context:Context, queryString:string) {
        this.rawString = queryString;

        // get all subgroups
        const groups:string[] = [...queryString.match(this.groupCapture)];

        const query:Query = new Query(context);

        // get and parse logic capture group
        this.logicGroups = groups.filter((s:string)=>this.logicGroup.test(s)).map((i:string)=>new LogicGroup(query, i));
        // get and parse simple groups
        this.simpleGroups = groups.filter((s:string)=>!this.logicGroup.test(s)).map((i:string) => new SimpleGroup(query, i));

        this.queryEngine = query;
    }


    /**
     * Execute the query per request
     *
     * @returns{Promise<Task[][]>}
     *
     */

    async execute(): Promise<Task[][]> {
        // Index the database
        await this.queryEngine.index();

        // Get parsed queries
        let parsedQueries:((i:Filterable)=>boolean)[][] = [];

        // Calculate all the queries
        (await Promise.all(
            [
                ...this.simpleGroups.map(
                    async (i:SimpleGroup) => 
                    (await i.synthesize()).forEach(
                        (j:((e:Filterable)=>boolean)[])=>parsedQueries.push(j)
                    )
                ), 
                ...this.logicGroups.map(
                    async (i:LogicGroup) => 
                    (await i.synthesize()).forEach(
                        (j:((e:Filterable)=>boolean)[])=>parsedQueries.push(j)
                    )
                ),
            ]
        ));

        // And now... Query!
        let results:Task[][] = await Promise.all(
            parsedQueries.map(
                (i:any) => this.queryEngine.batch_execute(Task, i)
            )
        ) as Task[][];

        return results;
    }

}

export { PerspectiveQuery };



