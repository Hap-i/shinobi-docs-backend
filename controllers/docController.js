const Document = require("../models/document")
const { catchAsync } = require("../utils/catchAsync")

exports.createNewDocument = catchAsync(async (req, res, next) => {
    const document = await Document.create({
        "data": req.body.data
    })
    res.status(201).json({
        status: "Success",
        data: {
            "title":document.title,
            "id":document._id

        }
    })
})

