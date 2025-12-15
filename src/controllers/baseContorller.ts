import { Request, Response } from "express";

class BaseController {
    model: any

    constructor(model: any) {
        this.model = model;
        this.create = this.create.bind(this);
        this.getAll = this.getAll.bind(this);
        this.getById = this.getById.bind(this);
        this.update = this.update.bind(this);
        this.del = this.del.bind(this);
    }

    async getAll(req: Request, res: Response) {
        try {
            if (req.query) {
                const filterData = await this.model.find(req.query);
                return res.json(filterData);
            } else {
                const data = await this.model.find();
                res.json(data);
            }
        } catch (err) {
            console.error(err);
            res.status(500).send("Error retrieving movies");
        }
    };

    async getById(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const data = await this.model.findById(id);
            if (!data) {
                return res.status(404).send("Movie not found");
            } else {
                res.json(data);
            }
        } catch (err) {
            console.error(err);
            res.status(500).send("Error retrieving movie by ID");
        }
    };

    async create(req: Request, res: Response) {
        const postData = req.body;
        console.log(postData);
        try {
            // If there's an id in route params and model has postId field, use it
            if (req.params.id) {
                const schema = this.model.schema;
                const hasPostId = schema.paths.postId !== undefined;
                
                if (hasPostId && !postData.postId) {
                    postData.postId = req.params.id;
                }
            }
            
            const data = await this.model.create(postData);
            res.status(201).json(data);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error creating post");
        } 
    };

    async del(req: Request, res: Response) {
        const id = req.params.id;
        try {
            const deletedData = await this.model.findByIdAndDelete(id);
            res.status(200).json(deletedData);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error deleting post");
        }
    };

    async update(req: Request, res: Response) {
        const id = req.params.id;
        const updatedData = req.body;
        try {
            const data = await this.model.findByIdAndUpdate(id, updatedData, {
                new: true,
            });
            res.json(data);
        } catch (err) {
            console.error(err);
            res.status(500).send("Error updating post");
        }
    };
};
export default BaseController