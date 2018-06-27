export const processImages = (batch) => {
    const reqBody = {
        "images": batch.map(image => ({
            url: image.url,
            customId: image.url.split('/').pop()
        })),
        "classes": [
          {
            "class": "person",
            "verify": "AUTO"
          }
        ]
    };

    return fetch('/process-batch', {
        method: 'POST',
        body: JSON.stringify(reqBody),
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(res => res);
}

export const getStatus = (id) => {
    return fetch(`/batch-status/${id}`, {
        headers: {
            'Content-Type': 'application/json'
        }
    })
    .then(res => res.json())
    .then(res => res);
}