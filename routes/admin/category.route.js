const router = require("express").Router();
const slugify = require("slugify");
const mongoose = require("mongoose");
const { categoryModel } = require("../../models/category.model");
const langReplace = require("../../utils/langReplace");
const nestedCategories = require("../../utils/nestedCategories");
const { Base64ToFile } = require("../../utils/base64ToFile");
const { isEqual } = require("../../utils/isEqual");
const { checkToken } = require("../../middlewares/authMiddleware")

const path = require("path");
const fs = require("fs");

// Create new Category 
router.post("/category-add", checkToken, async (req, res) => {
    try {

        if (!req.body.name || (!req.body.name.uz && !req.body.name.ru))
            return res.send({
                message: "category name not found"
            });
        req.body.slug = slugify(req.body.name.uz)

        const CategoryInstance = new categoryModel(req.body);
        if (CategoryInstance.parent) {
            await categoryModel.updateOne(
                { _id: CategoryInstance.parent },
                { $push: { children: CategoryInstance.id } }
            );
        }

        const newCategory = await CategoryInstance.save();
        return res.json({
            data: newCategory,
            message: "Success"
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json("server ishlamayapti")
    }
});



// Get all category
router.get("/category-all", checkToken, async (req, res) => {
    try {

        let page = parseInt(req.query.page) - 1 || 0;
        let limit = parseInt(req.query.limit) || 1;
        let search = req.query.search || "";

        let categories = await categoryModel.find({ parent: undefined })
            .populate({
                path: "children",
                populate: {
                    path: "children"
                }
            })
            .populate({
                path: "parent",
                populate: {
                    path: "parent"
                }
            })

            

        const products = categories.flatMap(cate => cate.products);

        return res.status(200).json({
            totalPage: Math.ceil(products.length / limit),
            page: page + 1,
            limit,
            categories
        });

    } catch (err) {
        if (err) {
            console.log(err)
            res.status(500).json("server ishlamayapti")
        }
    }
});





// Get byId Category 
router.get("/category-one/:id", checkToken, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(404).send("Category Id haqiqiy emas");
        }

        let category = await categoryModel.findById(req.params.id);
        if (!category) return res.status(404).send("Category topilmadi");
        return res.status(200).json(category.toObject());

    } catch (error) {
        console.log(error)
        res.status(500).send(error.message)
    }
})



// Edit Category 
router.put("/category-edit/:id", checkToken, async (req, res) => {
    if (req.body?.left_banner) {
        const { image } = req.body.left_banner;
        req.body.left_banner.image.uz = await new Base64ToFile(req).bufferInput(image.uz).save();
        req.body.left_banner.image.ru = await new Base64ToFile(req).bufferInput(image.ru).save();
    }

    if (req.body?.top_banner) {
        const {image} = req.body.top_banner;
        req.body.top_banner.image.uz = await new Base64ToFile(req).bufferInput(image.uz).save();
        req.body.top_banner.image.ru = await new Base64ToFile(req).bufferInput(image.ru).save();
    }


    try {

        const upadted = await categoryModel.findByIdAndUpdate(req.params.id, req.body);

        return res.status(200).json(upadted);

    } catch (error) {

        if (req.body?.left_banner) {
            const { image } = req.body.left_banner;
            const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
            const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
            fs.unlink(bannerUzPath, (err) => err && console.log(err));
            fs.unlink(bannerRuPath, (err) => err && console.log(err));
        }


        if (req.body?.top_banner) {
            const { image } = req.body.left_banner;
            const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
            const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
            fs.unlink(bannerUzPath, (err) => err && console.log(err));
            fs.unlink(bannerRuPath, (err) => err && console.log(err));
        }



        if (req.body.image) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.image)}`);
            fs.unlink(imagePath, (err) => err && console.log(err));
        }

        if (req.body.icon) {
            const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.icon)}`);
            fs.unlink(imagePath, (err) => err && console.log(err));
        }

        return res.status(500).json("server ishlamayapti")
    }
});


// Delete Category 
router.delete("/category-delete/:id", checkToken, async (req, res) => {
    try {
        const allCategoies = [];
        let parentDeleted = await categoryModel.findByIdAndDelete(req.params.id);
        if (!parentDeleted) return res.status(404).json("Category not found");
        parentDeleted = parentDeleted.toObject();

        const subDeleted = parentDeleted && await categoryModel.findOneAndDelete({ parentId: parentDeleted._id });
        const childDeleted = subDeleted && await categoryModel.findOneAndDelete({ parentId: subDeleted._id });
        allCategoies.push(parentDeleted, subDeleted, childDeleted);

        for (const cate of allCategoies) {
            if (cate?.left_banner) {
                const { image } = cate.left_banner;
                const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
                const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
                fs.unlink(bannerUzPath, (err) => err && console.log(err));
                fs.unlink(bannerRuPath, (err) => err && console.log(err));
            }


            if (cate?.top_banner) {
                const { image } = cate.left_banner;
                const bannerUzPath = path.join(__dirname, `../../uploads/${path.basename(image.uz)}`);
                const bannerRuPath = path.join(__dirname, `../../uploads/${path.basename(image.ru)}`);
                fs.unlink(bannerUzPath, (err) => err && console.log(err));
                fs.unlink(bannerRuPath, (err) => err && console.log(err));
            }



            if (cate?.image) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(cate.image)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

            if (req.body?.icon) {
                const imagePath = path.join(__dirname, `../../uploads/${path.basename(req.body.icon)}`);
                fs.unlink(imagePath, (err) => err && console.log(err));
            }

        }


        res.status(200).json(parentDeleted);

    } catch (error) {
        console.log(error);
        res.status(500).json("category o'chirib bo'lmadi")
    }
});



router.delete("/delete-left-banner", checkToken, async (req, res) => {
    const { category_id, banner_id } = req.body;
    const deletedBanner = await categoryModel.updateOne({ _id: category_id }, { $pull: { left_banner: { _id: banner_id } } });

})





module.exports = router;