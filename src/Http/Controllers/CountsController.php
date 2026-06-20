<?php

namespace Eyepiece\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Routing\Controller;
use Illuminate\Support\Facades\DB;
use Laravel\Telescope\Telescope;

class CountsController extends Controller
{
    public function __construct()
    {
        // Telescope would otherwise record every call to these endpoints as
        // a request entry plus N query entries against telescope_entries,
        // which feedback-loops the polling counts upwards forever.
        Telescope::stopRecording();
    }

    public function index()
    {
        $counts = $this->connection()
            ->table('telescope_entries')
            ->select('type', DB::raw('count(*) as total'))
            ->groupBy('type')
            ->pluck('total', 'type');

        return response()->json([
            'counts' => $counts,
        ]);
    }

    public function batchQueryCounts(Request $request)
    {
        $batchIds = array_filter((array) $request->input('batch_ids', []));

        if (empty($batchIds)) {
            return response()->json(['counts' => (object) []]);
        }

        $counts = $this->connection()
            ->table('telescope_entries')
            ->where('type', 'query')
            ->whereIn('batch_id', $batchIds)
            ->select('batch_id', DB::raw('count(*) as total'))
            ->groupBy('batch_id')
            ->pluck('total', 'batch_id');

        return response()->json([
            'counts' => $counts,
        ]);
    }

    protected function connection()
    {
        return DB::connection(
            config('telescope.storage.database.connection')
        );
    }
}
